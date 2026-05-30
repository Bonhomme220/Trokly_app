<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    private const PLAN_PRICES = [
        'basic'           => 499,
        'verified_phone'  => 1499,
        'verified_seller' => 2999,
    ];

    public function index(): JsonResponse
    {
        return response()->json([
            'listings' => [
                'pending_expertise' => Listing::where('status', 'pending_expertise')->count(),
                'published'         => Listing::where('status', 'published')->count(),
                'total'             => Listing::count(),
            ],
            'users' => [
                'total'     => User::count(),
                'new_today' => User::whereDate('created_at', today())->count(),
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $days = min((int) $request->get('days', 30), 365);
        $from = now()->subDays($days)->startOfDay();

        // All paid listings (lightweight query)
        $allPaid = Listing::where('payment_status', 'paid')
            ->select('id', 'plan', 'is_boosted', 'status', 'seller_id', 'paid_via_credit', 'updated_at')
            ->get();

        // Split: real payments vs credit-published
        $allReal   = $allPaid->where('paid_via_credit', false);
        $allCredit = $allPaid->where('paid_via_credit', true);

        // Period subsets
        $periodReal   = $allReal->filter(fn($l) => $l->updated_at >= $from);
        $periodCredit = $allCredit->filter(fn($l) => $l->updated_at >= $from);

        $calcRevenue = fn($col) => $col->sum(
            fn($l) => (self::PLAN_PRICES[$l->plan] ?? 0) + ($l->is_boosted ? 500 : 0)
        );

        // Plan breakdown (all-time, real payments only)
        $plans = [];
        foreach (self::PLAN_PRICES as $plan => $price) {
            $count = $allReal->where('plan', $plan)->count();
            $plans[$plan] = ['count' => $count, 'revenue' => $count * $price];
        }
        $boostCount = $allReal->where('is_boosted', true)->count();

        // Daily chart data for the period (real payments only)
        $chart = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayItems = $periodReal->filter(fn($l) => $l->updated_at->format('Y-m-d') === $date);
            $chart[] = [
                'date'     => $date,
                'label'    => now()->subDays($i)->format('d/m'),
                'revenue'  => (int) $calcRevenue($dayItems),
                'listings' => $dayItems->count(),
            ];
        }

        return response()->json([
            'revenue' => [
                'total'       => (int) $calcRevenue($allReal),
                'period'      => (int) $calcRevenue($periodReal),
                'period_days' => $days,
            ],
            'credits' => [
                'total_used'    => $allCredit->count(),
                'period_used'   => $periodCredit->count(),
                'value_total'   => (int) $calcRevenue($allCredit),
                'value_period'  => (int) $calcRevenue($periodCredit),
            ],
            'plans'  => $plans,
            'boosts' => ['count' => $boostCount, 'revenue' => $boostCount * 500],
            'listings' => [
                'total'             => Listing::count(),
                'paid'              => $allPaid->count(),
                'paid_real'         => $allReal->count(),
                'paid_credit'       => $allCredit->count(),
                'published'         => Listing::where('status', 'published')->count(),
                'pending_expertise' => Listing::where('status', 'pending_expertise')->count(),
                'sold'              => Listing::where('status', 'sold')->count(),
                'draft'             => Listing::where('payment_status', 'pending_payment')->count(),
            ],
            'sellers' => [
                'total'          => User::whereHas('listings', fn($q) => $q->where('payment_status', 'paid'))->count(),
                'new_this_month' => User::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
            'chart' => $chart,
        ]);
    }

    public function sellers(Request $request): JsonResponse
    {
        $query = User::with([
            'kyc:id,user_id,status',
            'listings' => fn($q) => $q->where('payment_status', 'paid')
                ->select('id', 'seller_id', 'plan', 'is_boosted', 'status', 'paid_via_credit'),
        ])
        ->withCount('listings as total_listings')
        ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('full_name', 'ilike', "%{$s}%")
                ->orWhere('email', 'ilike', "%{$s}%")
            );
        }

        $users = $query->paginate(min((int) $request->get('per_page', 50), 500));

        $users->through(function ($user) {
            $paid       = $user->listings;
            $paidReal   = $paid->where('paid_via_credit', false);
            $paidCredit = $paid->where('paid_via_credit', true);
            $totalSpent = $paidReal->sum(
                fn($l) => (self::PLAN_PRICES[$l->plan] ?? 0) + ($l->is_boosted ? 500 : 0)
            );

            return [
                'id'             => $user->id,
                'full_name'      => $user->full_name,
                'email'          => $user->email,
                'created_at'     => $user->created_at,
                'is_active'      => $user->is_active,
                'kyc_status'     => $user->kyc?->status,
                'listings_count'  => $paid->count(),
                'active'          => $paid->where('status', 'published')->count(),
                'sold'            => $paid->where('status', 'sold')->count(),
                'total_spent'     => $totalSpent,
                'credits_used'    => $paidCredit->count(),
                'listing_credits' => $user->listing_credits,
                'plans' => [
                    'basic'           => $paidReal->where('plan', 'basic')->count(),
                    'verified_phone'  => $paidReal->where('plan', 'verified_phone')->count(),
                    'verified_seller' => $paidReal->where('plan', 'verified_seller')->count(),
                ],
            ];
        });

        return response()->json($users);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Litigation;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'listings' => [
                'pending_expertise' => Listing::where('status', 'pending_expertise')->count(),
                'published' => Listing::where('status', 'published')->count(),
                'total' => Listing::count(),
            ],
            'transactions' => [
                'today' => Transaction::whereDate('created_at', today())->count(),
                'in_escrow' => Transaction::where('status', 'in_escrow')->count(),
                'revenue_month' => Transaction::whereMonth('created_at', now()->month)
                    ->where('status', 'completed')
                    ->sum('commission_amount'),
            ],
            'users' => [
                'total' => User::role('buyer_seller')->count(),
                'new_today' => User::role('buyer_seller')->whereDate('created_at', today())->count(),
            ],
            'litigations' => [
                'open' => Litigation::where('status', 'open')->count(),
                'under_review' => Litigation::where('status', 'under_review')->count(),
            ],
        ]);
    }
}

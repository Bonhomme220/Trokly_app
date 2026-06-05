<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'subscriptions:expire';
    protected $description = 'Expire les abonnements Pro échus et dépublie les annonces associées.';

    public function handle(): int
    {
        $expired = Subscription::where('status', 'active')
            ->where('expires_at', '<=', now())
            ->get();

        if ($expired->isEmpty()) {
            $this->info('Aucun abonnement à expirer.');
            return self::SUCCESS;
        }

        foreach ($expired as $sub) {
            DB::transaction(function () use ($sub) {
                // Dépublier toutes les annonces publiées liées à cet abonnement
                $sub->listings()
                    ->whereIn('status', ['published', 'pending_expertise'])
                    ->each(function ($listing) {
                        $listing->update(['status' => 'unpublished']);
                    });

                $sub->update(['status' => 'expired']);

                Log::info('Abonnement Pro expiré', [
                    'subscription_id' => $sub->id,
                    'user_id'         => $sub->user_id,
                    'expired_at'      => $sub->expires_at,
                ]);
            });
        }

        $count = $expired->count();
        $this->info("$count abonnement(s) expiré(s).");
        Log::info("subscriptions:expire — $count abonnement(s) expiré(s).");

        return self::SUCCESS;
    }
}

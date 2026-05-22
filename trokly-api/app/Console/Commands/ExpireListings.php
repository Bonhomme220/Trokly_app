<?php

namespace App\Console\Commands;

use App\Models\Listing;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ExpireListings extends Command
{
    protected $signature   = 'listings:expire';
    protected $description = 'Dépublie les annonces dont la date d\'expiration est dépassée.';

    public function handle(NotificationService $notif): int
    {
        $expired = Listing::where('status', 'published')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', Carbon::now())
            ->get();

        if ($expired->isEmpty()) {
            $this->info('Aucune annonce à expirer.');
            return Command::SUCCESS;
        }

        foreach ($expired as $listing) {
            $listing->update(['status' => 'unpublished']);

            // Notifier le vendeur par e-mail
            try {
                $notif->listingExpired(
                    $listing->seller,
                    "{$listing->iphone_model} {$listing->capacity}Go",
                    $listing->asking_price
                );
            } catch (\Throwable $e) {
                // Log sans bloquer
                \Log::warning("ExpireListings: notification failed for listing {$listing->id}: {$e->getMessage()}");
            }
        }

        $this->info("Expirées : {$expired->count()} annonce(s).");

        return Command::SUCCESS;
    }
}

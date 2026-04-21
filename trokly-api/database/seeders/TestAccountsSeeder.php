<?php

namespace Database\Seeders;

use App\Models\Expertise;
use App\Models\Listing;
use App\Models\ListingPhoto;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class TestAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Comptes ──────────────────────────────────────────────
        $accounts = [
            ['phone' => '+22901000001', 'full_name' => 'Kofi Acheteur',  'role' => 'buyer_seller'],
            ['phone' => '+22901000002', 'full_name' => 'Amina Vendeuse', 'role' => 'buyer_seller'],
            ['phone' => '+22901000003', 'full_name' => 'Expert Trokly',  'role' => 'expert'],
            ['phone' => '+22901000004', 'full_name' => 'Livreur Trokly', 'role' => 'delivery_agent'],
            ['phone' => '+22901000005', 'full_name' => 'Admin Trokly',   'role' => 'admin'],
        ];

        $users = [];
        foreach ($accounts as $data) {
            $user = User::firstOrCreate(
                ['phone_number' => $data['phone']],
                ['full_name' => $data['full_name'], 'phone_verified' => true, 'is_active' => true]
            );
            $user->syncRoles([$data['role']]);
            if (!$user->wallet) Wallet::create(['user_id' => $user->id]);
            $users[$data['role']][] = $user;
        }

        $seller1 = $users['buyer_seller'][0]; // Kofi
        $seller2 = $users['buyer_seller'][1]; // Amina
        $expert  = $users['expert'][0];

        // ── Photos placeholder (Picsum) ───────────────────────────
        $phonePics = [
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
            'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
            'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
            'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
        ];

        // ── Annonces ─────────────────────────────────────────────
        $listingsData = [
            // Publiées + expertisées
            [
                'seller'        => $seller2,
                'iphone_model'  => 'iPhone 15 Pro',
                'capacity'      => 256,
                'color'         => 'Titane naturel',
                'condition'     => 'like_new',
                'imei'          => '354612108765432',
                'asking_price'  => 620000,
                'retail_price'  => 750000,
                'description'   => 'Acheté en janvier 2024. Très bon état, batterie 96%. Vendu avec boîte et câble originaux.',
                'accepts_trade' => true,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'A',
            ],
            [
                'seller'        => $seller2,
                'iphone_model'  => 'iPhone 14 Pro Max',
                'capacity'      => 512,
                'color'         => 'Noir sidéral',
                'condition'     => 'good',
                'imei'          => '354612108765433',
                'asking_price'  => 520000,
                'retail_price'  => 680000,
                'description'   => 'Batterie 89%. Quelques micro-rayures invisibles à l\'usage. Face ID parfait.',
                'accepts_trade' => true,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'B',
            ],
            [
                'seller'        => $seller1,
                'iphone_model'  => 'iPhone 13',
                'capacity'      => 128,
                'color'         => 'Minuit',
                'condition'     => 'good',
                'imei'          => '354612108765434',
                'asking_price'  => 230000,
                'retail_price'  => 320000,
                'description'   => 'Fonctionnel, batterie 91%. Pas d\'impact ni de fissure.',
                'accepts_trade' => false,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'B',
            ],
            [
                'seller'        => $seller2,
                'iphone_model'  => 'iPhone 15',
                'capacity'      => 128,
                'color'         => 'Rose',
                'condition'     => 'like_new',
                'imei'          => '354612108765435',
                'asking_price'  => 410000,
                'retail_price'  => 510000,
                'description'   => 'Neuf déballé en mars 2024. Garantie Apple valide jusqu\'en mars 2025.',
                'accepts_trade' => true,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'A',
            ],
            [
                'seller'        => $seller1,
                'iphone_model'  => 'iPhone 12 Pro',
                'capacity'      => 256,
                'color'         => 'Argent',
                'condition'     => 'fair',
                'imei'          => '354612108765436',
                'asking_price'  => 175000,
                'retail_price'  => 290000,
                'description'   => 'Écran remplacé (compatible). Batterie 78%. Fonctionne parfaitement.',
                'accepts_trade' => true,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'C',
            ],
            [
                'seller'        => $seller2,
                'iphone_model'  => 'iPhone 16 Pro Max',
                'capacity'      => 256,
                'color'         => 'Titane désert',
                'condition'     => 'new',
                'imei'          => '354612108765437',
                'asking_price'  => 850000,
                'retail_price'  => 950000,
                'description'   => 'Neuf scellé, jamais ouvert. Facture d\'achat disponible.',
                'accepts_trade' => false,
                'sale_type'     => 'marketplace',
                'status'        => 'published',
                'quality_grade' => 'A',
            ],
            // En attente d'expertise
            [
                'seller'        => $seller1,
                'iphone_model'  => 'iPhone 14',
                'capacity'      => 128,
                'color'         => 'Bleu',
                'condition'     => 'good',
                'imei'          => '354612108765438',
                'asking_price'  => 310000,
                'retail_price'  => 400000,
                'description'   => null,
                'accepts_trade' => true,
                'sale_type'     => 'marketplace',
                'status'        => 'pending_expertise',
                'quality_grade' => null,
            ],
            // Rachat rapide
            [
                'seller'        => $seller1,
                'iphone_model'  => 'iPhone 13 Pro',
                'capacity'      => 256,
                'color'         => 'Or',
                'condition'     => 'good',
                'imei'          => '354612108765439',
                'asking_price'  => 280000,
                'retail_price'  => 380000,
                'description'   => 'Vente rapide souhaitée.',
                'accepts_trade' => false,
                'sale_type'     => 'quick_sale',
                'status'        => 'pending_expertise',
                'quality_grade' => null,
            ],
        ];

        foreach ($listingsData as $i => $data) {
            $existing = Listing::where('imei', $data['imei'])->first();
            if ($existing) continue;

            $listing = Listing::create([
                'seller_id'          => $data['seller']->id,
                'iphone_model'       => $data['iphone_model'],
                'capacity'           => $data['capacity'],
                'color'              => $data['color'],
                'condition'          => $data['condition'],
                'imei'               => $data['imei'],
                'asking_price'       => $data['asking_price'],
                'retail_price'       => $data['retail_price'],
                'ai_suggested_price' => $data['asking_price'] - rand(5000, 20000),
                'description'        => $data['description'],
                'accepts_trade'      => $data['accepts_trade'],
                'sale_type'          => $data['sale_type'],
                'status'             => $data['status'],
                'quality_grade'      => $data['quality_grade'],
                'views_count'        => rand(12, 340),
            ]);

            // Photos vendeur
            foreach ($phonePics as $j => $url) {
                ListingPhoto::create([
                    'listing_id' => $listing->id,
                    'url'        => $url,
                    'type'       => 'seller',
                    'order'      => $j,
                ]);
            }

            // Expertise pour les annonces publiées
            if ($data['status'] === 'published' && $data['quality_grade']) {
                Expertise::firstOrCreate(
                    ['listing_id' => $listing->id],
                    [
                        'expert_id'     => $expert->id,
                        'quality_grade' => $data['quality_grade'],
                        'checklist'     => [
                            'ecran_intact'       => true,
                            'chassis_intact'     => $data['quality_grade'] !== 'C',
                            'batterie_ok'        => true,
                            'face_id_ok'         => true,
                            'cameras_ok'         => true,
                            'boutons_ok'         => true,
                            'haut_parleur_ok'    => true,
                            'sim_ok'             => true,
                            'icloud_deconnecte'  => true,
                        ],
                        'notes'        => "Contrôle effectué en boutique. Grade {$data['quality_grade']}.",
                        'completed_at' => now()->subDays(rand(1, 15)),
                    ]
                );

                // Photos expertise
                foreach (array_slice($phonePics, 0, 3) as $j => $url) {
                    ListingPhoto::firstOrCreate(
                        ['listing_id' => $listing->id, 'type' => 'expertise', 'order' => $j],
                        ['url' => $url]
                    );
                }
            }
        }

        $this->command->info('✓ Comptes de test créés :');
        $this->command->table(
            ['Téléphone', 'Nom', 'Rôle'],
            collect($accounts)->map(fn($a) => [$a['phone'], $a['full_name'], $a['role']])->toArray()
        );
        $this->command->info('✓ ' . count($listingsData) . ' annonces créées.');
        $this->command->newLine();
        $this->command->warn('Code OTP visible dans storage/logs/laravel.log (mode dev).');
    }
}

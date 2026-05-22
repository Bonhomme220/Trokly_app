<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private function send(string $to, string $subject, string $html): void
    {
        $apiKey = config('services.brevo.key');

        if (!$apiKey) {
            Log::info("Email [{$subject}] → {$to}");
            return;
        }

        $response = Http::withHeaders([
            'api-key'      => $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', [
            'sender'      => ['name' => 'Trokly', 'email' => 'contact.onepointcom@gmail.com'],
            'to'          => [['email' => $to]],
            'subject'     => $subject,
            'htmlContent' => $html,
        ]);

        if (!$response->successful()) {
            Log::error("Brevo email failed [{$subject}] → {$to}: " . $response->body());
        }
    }

    private function template(string $title, string $body, string $ctaText = '', string $ctaUrl = ''): string
    {
        $cta = $ctaText ? "
            <div style='text-align:center;margin:28px 0'>
                <a href='{$ctaUrl}'
                   style='background:#00D084;color:#0B1A2B;padding:12px 28px;border-radius:8px;
                          font-weight:700;text-decoration:none;font-size:15px'>
                    {$ctaText}
                </a>
            </div>" : '';

        return "<!DOCTYPE html>
        <html><head><meta charset='utf-8'></head>
        <body style='font-family:sans-serif;background:#F7F5F0;margin:0;padding:20px'>
          <div style='max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden'>
            <div style='background:#0B1A2B;padding:24px 32px;text-align:center'>
              <span style='color:#00D084;font-size:22px;font-weight:900;letter-spacing:-0.5px'>Trokly</span>
            </div>
            <div style='padding:32px'>
              <h2 style='color:#0B1A2B;margin:0 0 16px;font-size:20px'>{$title}</h2>
              <div style='color:#4A5568;line-height:1.7;font-size:15px'>{$body}</div>
              {$cta}
            </div>
            <div style='background:#F7F5F0;padding:16px 32px;text-align:center'>
              <p style='color:#8A99AA;font-size:12px;margin:0'>
                Trokly · Marketplace iPhones · Cotonou, Bénin
              </p>
            </div>
          </div>
        </body></html>";
    }

    // ─── EXPERTISE ─────────────────────────────────────────────

    public function listingSubmitted(User $seller, string $iphoneModel, ?string $sellerWhatsapp = null): void
    {
        $contact = $sellerWhatsapp
            ? "<p>📲 Notre expert vous contactera sur votre WhatsApp <strong>{$sellerWhatsapp}</strong> pour fixer un rendez-vous à votre convenance.</p>"
            : "<p>📲 Notre expert vous contactera sur votre WhatsApp pour fixer un rendez-vous à votre convenance.</p>";

        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Votre annonce pour le <strong>{$iphoneModel}</strong> a bien été reçue et est en attente de vérification.</p>
                 {$contact}
                 <p>✅ <strong>Pas besoin de vous déplacer</strong> — l'expert Trokly se déplace chez vous. La vérification prend environ 15 minutes. Une fois validé, votre annonce sera publiée automatiquement.</p>
                 <p style='font-size:13px;color:#8A99AA'>Pensez à avoir votre iPhone chargé et prêt au moment de la visite.</p>";

        $this->send(
            $seller->email,
            "📱 Votre annonce reçue — un expert Trokly vient chez vous",
            $this->template("Annonce bien reçue !", $body)
        );
    }

    public function listingPublished(User $seller, string $iphoneModel, int $price, string $appUrl): void
    {
        $priceFormatted = number_format($price, 0, ',', ' ') . ' FCFA';
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Bonne nouvelle ! Votre <strong>{$iphoneModel}</strong> a passé l'expertise avec succès.</p>
                 <p>Votre annonce est maintenant <strong style='color:#00B070'>publiée</strong> au prix de <strong>{$priceFormatted}</strong>.</p>
                 <p>Vous serez notifié dès qu'un acheteur se manifeste.</p>";

        $this->send(
            $seller->email,
            "✅ Votre iPhone est en ligne sur Trokly",
            $this->template("Annonce publiée !", $body, "Voir mon annonce", $appUrl)
        );
    }

    public function listingRejected(User $seller, string $iphoneModel, string $reason): void
    {
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Après expertise, votre <strong>{$iphoneModel}</strong> n'a pas pu être accepté.</p>
                 <p><strong>Raison :</strong> {$reason}</p>
                 <p>Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href='mailto:support@trokly.bj'>support@trokly.bj</a>.</p>";

        $this->send(
            $seller->email,
            "❌ Votre iPhone n'a pas passé l'expertise",
            $this->template("Expertise non validée", $body)
        );
    }

    public function listingExpired(User $seller, string $iphoneModel, int $price): void
    {
        $priceFormatted = number_format($price, 0, ',', ' ') . ' FCFA';
        $republishUrl   = config('app.frontend_url', 'https://trokly-web.onrender.com') . '/listings/new';

        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Votre annonce pour le <strong>{$iphoneModel}</strong> ({$priceFormatted}) a expiré après 30 jours.</p>
                 <p>Si vous souhaitez toujours vendre cet iPhone, vous pouvez republier une nouvelle annonce rapidement.</p>";

        $this->send(
            $seller->email,
            "⏰ Votre annonce a expiré",
            $this->template("Annonce expirée", $body, "Republier mon iPhone", $republishUrl)
        );
    }

    // ─── VENTE ─────────────────────────────────────────────────

    public function phoneSold(User $seller, string $iphoneModel, int $amount): void
    {
        $amountFormatted = number_format($amount, 0, ',', ' ') . ' FCFA';
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Votre <strong>{$iphoneModel}</strong> vient d'être vendu !</p>
                 <p>Un livreur Trokly va vous contacter pour venir récupérer votre téléphone et le remettre à l'acheteur.</p>
                 <p>💰 <strong>{$amountFormatted}</strong> seront crédités sur votre wallet Trokly après confirmation de livraison.</p>
                 <p><strong>Important :</strong> gardez votre téléphone en l'état jusqu'au passage du livreur.</p>";

        $this->send(
            $seller->email,
            "🎉 Votre iPhone est vendu !",
            $this->template("Vendu !", $body)
        );
    }

    public function paymentReleased(User $seller, string $iphoneModel, int $amount): void
    {
        $amountFormatted = number_format($amount, 0, ',', ' ') . ' FCFA';
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p><strong>{$amountFormatted}</strong> ont été crédités sur votre wallet Trokly suite à la vente de votre <strong>{$iphoneModel}</strong>.</p>
                 <p>Vous pouvez retirer ces fonds vers votre Mobile Money quand vous le souhaitez.</p>";

        $this->send(
            $seller->email,
            "💰 Paiement reçu sur votre wallet",
            $this->template("Paiement effectué", $body)
        );
    }

    public function pickupCheckFailed(User $seller, string $iphoneModel, string $notes): void
    {
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p>Le livreur a constaté une différence avec l'état expertisé de votre <strong>{$iphoneModel}</strong>.</p>
                 <p><strong>Observations :</strong> {$notes}</p>
                 <p>La transaction est temporairement suspendue. Notre équipe vous contactera dans les 24h.</p>";

        $this->send(
            $seller->email,
            "⚠️ Contrôle à la récupération — action requise",
            $this->template("Contrôle signalé", $body)
        );
    }

    // ─── TROC ──────────────────────────────────────────────────

    public function tradeProposalReceived(User $seller, string $initiatorName, string $targetModel, string $proposedModel, string $appUrl): void
    {
        $body = "<p>Bonjour <strong>{$seller->full_name}</strong>,</p>
                 <p><strong>{$initiatorName}</strong> vous propose un troc pour votre <strong>{$targetModel}</strong>.</p>
                 <p>Il propose son <strong>{$proposedModel}</strong> en échange.</p>
                 <p>Consultez la proposition pour accepter, refuser ou faire une contre-offre.</p>";

        $this->send(
            $seller->email,
            "🔄 Nouvelle proposition de troc",
            $this->template("Proposition de troc reçue", $body, "Voir la proposition", $appUrl)
        );
    }

    public function tradeOfferReceived(User $recipient, string $senderName, int $soulte, string $appUrl): void
    {
        $soulteText = $soulte === 0
            ? "sans soulte (échange équitable)"
            : (number_format(abs($soulte), 0, ',', ' ') . ' FCFA ' . ($soulte > 0 ? 'à votre avantage' : 'demandée'));

        $body = "<p>Bonjour <strong>{$recipient->full_name}</strong>,</p>
                 <p><strong>{$senderName}</strong> a fait une nouvelle offre : <strong>{$soulteText}</strong>.</p>
                 <p>Vous avez jusqu'au round 3 pour parvenir à un accord.</p>";

        $this->send(
            $recipient->email,
            "🔄 Nouvelle offre de troc",
            $this->template("Offre reçue", $body, "Répondre", $appUrl)
        );
    }

    public function tradeAgreed(User $user, string $partnerName, string $expertName, string $expertAddress, string $appUrl): void
    {
        $expertInfo = $expertName
            ? "<p>📍 <strong>Où apporter votre téléphone :</strong><br>
               <strong>{$expertName}</strong><br>{$expertAddress}</p>"
            : "<p>Notre équipe vous contactera pour organiser l'expertise.</p>";

        $body = "<p>Bonjour <strong>{$user->full_name}</strong>,</p>
                 <p>Accord conclu avec <strong>{$partnerName}</strong> ! 🎉</p>
                 <p>Les deux téléphones doivent maintenant être vérifiés par un expert Trokly.</p>
                 {$expertInfo}
                 <p>Apportez votre iPhone pour expertise. Une fois les deux téléphones validés, l'échange sera organisé.</p>";

        $this->send(
            $user->email,
            "✅ Troc accepté — amenez votre iPhone",
            $this->template("Accord de troc !", $body, "Voir le troc", $appUrl)
        );
    }
}

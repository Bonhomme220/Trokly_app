<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes (Laravel 11 Scheduler)
|--------------------------------------------------------------------------
|
| Ce fichier est chargé automatiquement par bootstrap/app.php.
| Chaque tâche planifiée est définie ici via la façade Schedule.
|
*/

// Dépublier les annonces expirées tous les jours à 02h00
Schedule::command('listings:expire')->dailyAt('02:00');

// Expirer les abonnements Pro échus et dépublier les annonces liées
Schedule::command('subscriptions:expire')->dailyAt('02:15');

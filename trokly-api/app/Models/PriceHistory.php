<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceHistory extends Model
{
    protected $fillable = [
        'iphone_model',
        'capacity',
        'color',
        'condition',
        'quality_grade',
        'sale_price',
        'transaction_type',
        'sale_date',
    ];

    protected function casts(): array
    {
        return [
            'sale_price' => 'integer',
            'sale_date' => 'date',
        ];
    }
}

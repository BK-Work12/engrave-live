<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\Stripe;
use Stripe\Price;

class ListStripePrices extends Command
{
    protected $signature = 'stripe:list-prices';
    protected $description = 'List all Stripe Price IDs from the configured account';

    public function handle()
    {
        $secret = config('services.stripe.secret') ?? config('cashier.secret');
        
        if (!$secret) {
            $this->error('Stripe Secret Key not found in config. Please check your .env file.');
            return;
        }

        Stripe::setApiKey($secret);

        try {
            $prices = Price::all(['limit' => 20, 'expand' => ['data.product']]);
            
            if (empty($prices->data)) {
                $this->warn('No prices found in your Stripe account. Please create some Products/Prices in your Stripe Dashboard first.');
                return;
            }

            $this->info('Available Stripe Prices:');
            $headers = ['Product Name', 'Price ID', 'Amount', 'Currency'];
            $data = [];

            foreach ($prices->data as $price) {
                $data[] = [
                    $price->product->name ?? 'N/A',
                    $price->id,
                    $price->unit_amount / 100,
                    strtoupper($price->currency)
                ];
            }

            $this->table($headers, $data);
        } catch (\Exception $e) {
            $this->error('Error fetching prices: ' . $e->getMessage());
        }
    }
}

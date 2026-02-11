<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Cashier\Cashier;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function checkout(Request $request)
    {
        $priceId = $request->input('price_id'); // e.g., 'price_H5ggYndUyNY'
        $credits = $request->input('credits'); // e.g., 25

        // Map price IDs to credit amounts securely on the backend if preferred,
        // or accept them from the frontend if you have a predefined map.
        // For simplicity, let's assume we pass a predefined product ID.

        $checkout = $request->user()
            ->checkout([$priceId => 1], [
                'success_url' => route('checkout.success') . '?session_id={CHECKOUT_SESSION_ID}&credits=' . $credits,
                'cancel_url' => url('/pricing'),
                'metadata' => ['credits' => $credits],
            ]);

        return Inertia::location($checkout->redirect()->getTargetUrl());
    }

    public function success(Request $request)
    {
        $sessionId = $request->input('session_id');
        $credits = $request->input('credits');

        // Verify session - In a real app, use a webhook to fulfill.
        // For simple one-off:
        if ($sessionId && $credits) {
            $request->user()->increment('credits', $credits);
        }

        return redirect('/svg-tracing')->with('success', 'Credits added successfully!');
    }
}

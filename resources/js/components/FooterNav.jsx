import { Link, usePage } from "@inertiajs/react";

export default function FooterNav(){
    const { url } = usePage();

    // Helper function to check if link is active
    const isActive = (path) => {
        return url === path ? "Navlink active" : "Navlink";
    };

    return(
        <div className="p-6 mx-auto flex flex-col lg:flex-row justify-between items-center mt-12.5 relative">
            <nav className="flex flex-col lg:flex-row gap-5 text-[#D6D6D6] text-lg list-none text-center ">
                <Link href="/faq" className={isActive("/faq")}>FAQs</Link>
                <Link href="/create" className={isActive("/create")}>Create</Link>
                <Link href="/how-it-works" className={isActive("/how-it-works")}>How It Works</Link>
                <Link href="/style-examples" className={isActive("/style-examples")}>Style Examples</Link>
                <Link href="/pricing" className={isActive("/pricing")}>Pricing / Credits</Link>
                <Link href="/privacy-policy" className="Navlink">Privacy Policy</Link>
            </nav>
            <p className="mt-6 lg:mt-0">@2025 Engrave Fill. All rights reserved.</p>
        </div>
    )
}

import AuthBtn from "../components/AuthBtn";
import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";
import { Link } from "@inertiajs/react";
import SignupForm from "../components/SignupForm";
export default function SignUp() {
    return (
        <>
            <div className="flex flex-col h-dvh m-auto items-center">
                <SignupForm />
            </div>
        </>
    );
}


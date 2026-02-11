import { useForm } from "@inertiajs/react";
import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";

export default function ForgetPasswordForm() {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <div className="bg-[#171616] md:max-w-[535px] rounded-[30px] ">
                <form onSubmit={submit} className="px-4 pt-3 pb-5">
                    <AuthHead title="Forget Password" description="Enter your email to receive a code to reset your password and regain access to your account." />
                    <div className="mt-5.5">
                        <label htmlFor="email" className="label-fld">Email Address</label><br />
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="mt-2.5 input-fld "
                            placeholder="Enter Email Address"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        /><br />
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                        {wasSuccessful && <div className="text-green-500 text-sm mt-1">Reset link sent! Please check your email.</div>}
                    </div>
                    <PrimaryButton text={processing ? "Sending..." : "Continue"} className="mt-7 w-full" disabled={processing} />
                </form>
            </div>
        </>
    )
}

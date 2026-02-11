import AuthBtn from "../components/AuthBtn";
import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import { Link, useForm } from "@inertiajs/react";

export default function LoginForm() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <div className="bg-[#171616] md:max-w-[535px] rounded-[30px] ">
                <form onSubmit={submit} className="px-4 pt-3 pb-5">
                    <AuthHead title="Login" description="AI-powered generator that turns simple outlines into detailed engraving fills in seconds." />
                    <div className="mt-6 flex flex-col gap-4.5">
                        <div>
                            <label htmlFor="email" className="label-fld">Email Address</label><br />
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="mt-2.5 input-fld "
                                placeholder="Enter Email Adress"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            /><br />
                            {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                        </div>
                        <div>
                            <label htmlFor="password" className="label-fld">Password</label><br />
                            <input
                                type="password"
                                name="password"
                                id="password"
                                className="mt-2.5 input-fld"
                                placeholder="Enter Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            /><br />
                            {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                        </div>
                        <div className="flex justify-between mt-4">
                            <div>
                                <input
                                    type="checkbox"
                                    name="reminder"
                                    id="reminder"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <label htmlFor="reminder" className="ml-2">Remember me</label>
                            </div>
                            <Link className="text-sm font-medium gradient-text" href="/forgot-password">Forgot password?</Link>
                        </div>

                    </div>
                    <PrimaryButton text={processing ? "Logging in..." : "Login"} className="w-full mb-6.5 mt-4" disabled={processing} />
                    {/* <AuthBtn text="Login with Google" /> */}
                    <span className="text-sm text-[#808080] text-center mt-2.5 flex justify-center">Already have an account? <span className="gradient-text">Login</span></span>
                </form>
            </div>
        </>
    );
}

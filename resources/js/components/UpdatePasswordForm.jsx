import { useForm } from "@inertiajs/react";
import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";

export default function UpdatePasswordForm({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <>
            <div className="bg-[#171616] md:max-w-[535px] rounded-[30px] ">
                <form onSubmit={submit} className="px-4 pt-3 pb-5">
                    <AuthHead title="Update Password" description="Set a new password for your account to keep it secure and continue using our services." />

                    <input type="hidden" name="token" value={data.token} />

                    <div className="mt-5.5">
                        <label htmlFor="email" className="label-fld">Email Address</label><br />
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="mt-2.5 input-fld "
                            placeholder="Enter Email Address"
                            value={data.email}
                            readOnly={!!email}
                            onChange={(e) => setData('email', e.target.value)}
                        /><br />
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                    </div>

                    <div className="mt-4.5">
                        <label htmlFor="password" className="label-fld">Create New Password</label><br />
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="mt-2.5 input-fld "
                            placeholder="Enter Password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        /><br />
                        {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                    </div>

                    <div className="mt-4.5">
                        <label htmlFor="password_confirmation" className="label-fld">Confirm New Password</label><br />
                        <input
                            type="password"
                            name="password_confirmation"
                            id="password_confirmation"
                            className="mt-2.5 input-fld "
                            placeholder="Confirm Password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        /><br />
                        {errors.password_confirmation && <div className="text-red-500 text-sm mt-1">{errors.password_confirmation}</div>}
                    </div>

                    <PrimaryButton text={processing ? "Updating..." : "Update Password"} className="mt-6 w-full" disabled={processing} />
                </form>
            </div>
        </>
    )
}

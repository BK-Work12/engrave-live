import AuthBtn from "../components/AuthBtn";
import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";
import { Link, useForm } from "@inertiajs/react";

export default function SignupForm() {
    const { data, setData, post, processing, errors } = useForm({
        fname: '',
        lname: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/signup');
    };

    return (
        <>
            <div className="relative">
                <div className="bg-[#171616] md:max-w-[535px] rounded-[30px] my-20">
                    <div className="blur-[279.3px] bg-[#6235FD] absolute right-0 bottom-0 w-[366px] h-[368px]"></div>
                    <form onSubmit={submit} className="px-4 pt-3 pb-5 relative">
                        <AuthHead title="Sign Up" description="AI-powered generator that turns simple outlines into detailed engraving fills in seconds." />
                        <div className="mt-6 ">
                            <div className="flex gap-6 w-full">
                                <div className="w-full">
                                    <label htmlFor="fname" className="label-fld">First Name</label><br />
                                    <input
                                        type="text"
                                        name="fname"
                                        id="fname"
                                        className="mt-2.5 input-fld "
                                        placeholder="Enter First Name"
                                        value={data.fname}
                                        onChange={(e) => setData('fname', e.target.value)}
                                    /><br />
                                    {errors.fname && <div className="text-red-500 text-sm mt-1">{errors.fname}</div>}
                                </div>
                                <div className="w-full">
                                    <label htmlFor="lname" className="mt-4.5 label-fld">Last Name</label><br />
                                    <input
                                        type="text"
                                        name="lname"
                                        id="lname"
                                        className="mt-2.5 input-fld"
                                        placeholder="Enter Last Name"
                                        value={data.lname}
                                        onChange={(e) => setData('lname', e.target.value)}
                                    /><br />
                                    {errors.lname && <div className="text-red-500 text-sm mt-1">{errors.lname}</div>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-4.5 mt-4.5">
                                <div >
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
                                <div >
                                    <label htmlFor="password" className=" label-fld">Create Password</label><br />
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
                                <div >
                                    <label htmlFor="Cpassword" className=" label-fld">Confirm Password</label><br />
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        id="Cpassword"
                                        className="mt-2.5 input-fld"
                                        placeholder="Confirm Password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    /><br />
                                </div>
                            </div>

                        </div>
                        <div className="mt-6">
                            <PrimaryButton text={processing ? "Signing Up..." : "Sign Up"} className="w-full mb-6.5 " disabled={processing} />
                            {/* <AuthBtn text="Sign up with Google" /> */}
                            <span className="text-sm text-[#808080] text-center mt-2.5 flex justify-center">Already have an account? <Link className="gradient-text" to="/login">Login</Link></span>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

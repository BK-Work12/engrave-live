import AuthHead from "../components/AuthHead";
import PrimaryButton from "../components/PrimaryButton";

export default function VerifyForm(){
    return(
        <>
            <div className="bg-[#171616] md:max-w-[455px] rounded-[30px] ">
                <div className="px-4 pt-3 pb-5">
                    <AuthHead title="Verify Your E-mail" description="Enter the verification code sent to your email rohailshaheen46@gmail.com"/>
                    <div className="mt-11 flex justify-center gap-4">
                        <div className="empty-box"></div>
                        <div className="empty-box"></div>
                        <div className="empty-box"></div>
                        <div className="empty-box"></div>
                        <div className="empty-box"></div>
                        <div className="empty-box"></div>
                    </div>
                    <PrimaryButton text="Continue" className="mt-13.5 w-full"/>
                </div>
            </div>
        </>
    )
}
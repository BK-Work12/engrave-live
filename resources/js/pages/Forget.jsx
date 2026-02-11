import { router } from "@inertiajs/react";
import Layout from "./Layout";
import ForgetPasswordForm from "../components/ForgetPasswordForm";

export default function Forget() {
    return (
        // <Layout>
            <div className="flex flex-col h-dvh justify-center items-center">
                <ForgetPasswordForm />
            </div>
        // </Layout>
    )
}

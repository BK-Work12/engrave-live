import UpdatePasswordForm from "../components/UpdatePasswordForm";
import Layout from "./Layout";

export default function UpdatePassword({ token, email }) {
    return (
        <Layout>
            <div className="flex flex-col h-dvh justify-center items-center">
                <UpdatePasswordForm token={token} email={email} />
            </div>
        </Layout>
    )
}

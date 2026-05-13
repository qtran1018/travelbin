import { Navbar } from "./Navbar"
import { Outlet } from "react-router-dom"
import {Footer} from "./Footer"

export function Layout() {
    return (
        <>
        <div className="page-container">
            <header>
                <Navbar />
            </header>
                <main className="content-wrap">
                    <Outlet />
                </main>
            <Footer />
        </div>
        </>
    )
}
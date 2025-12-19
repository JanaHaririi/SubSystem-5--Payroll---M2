"use client"
import { useAuth } from "../(system)/context/authContext"
import { usePathname, useRouter } from "next/navigation"
import { FaSignOutAlt, FaUser, FaHome, FaBriefcase, FaCog, FaBell } from "react-icons/fa"
import { useState, useEffect } from "react"
import axios from "axios"

export default function Navbar(){
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [scrolled, setScrolled] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [notificationCount, setNotificationCount] = useState() // Example count
    
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = async () => {
        await logout();
    };

    // Don't show navbar on login/register pages or home (home has its own header)
    if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/recruitment/")) {
        return null;
    }
    
    if(!user){
        return null;
    }

    // Navigation items
    const navItems = [
        { label: "Dashboard", href: "/home", icon: <FaHome /> },
        { label: "Profile", href: "/profile", icon: <FaUser /> },
    ]

    // Extract user initials for avatar
    const getUserInitials = () => {
        if (user?.name) {
            return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return user?.email?.slice(0, 2).toUpperCase()
    }

    return(
        <>
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled 
                    ? 'bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-xl' 
                    : 'bg-gradient-to-r from-slate-900/90 via-slate-900/85 to-slate-900/90 backdrop-blur-md border-b border-slate-800'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Left Side - Logo and Navigation */}
                        <div className="flex items-center gap-8">
                            {/* Logo/Brand */}
                            <div 
                                className="flex items-center gap-3 cursor-pointer group" 
                                onClick={() => router.push('/home')}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-white font-bold text-lg">HR</span>
                                    </div>
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white tracking-tight">
                                        HR Management
                                    </h1>
                                    <p className="text-xs text-slate-400 -mt-1">Enterprise Platform</p>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => router.push(item.href)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-slate-800/50 text-white shadow-inner'
                                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <span className={`text-sm ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Right Side - User Actions */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors duration-300 group" onClick={()=>{router.push('/time-management/notifications')}}>
                                <FaBell className="text-lg" />
                                
                                    <>
                                            {notificationCount}
                                        <div className="absolute -inset-1  rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                                    </>
                                
                            </button>

                            {/* User Profile Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-800/50 transition-all duration-300 group"
                                >
                                    {/* Avatar with initials */}
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-105 transition-transform duration-300">
                                            {getUserInitials()}
                                        </div>
                                        <div className="absolute inset-0 rounded-xl border border-slate-600/50 group-hover:border-slate-500 transition-colors duration-300"></div>
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    
                                    {/* User Info */}
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-white">
                                            {user?.name || user?.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {user?.role || 'User'}
                                        </p>
                                    </div>
                                </button>

                                {/* Profile Dropdown Menu */}
                                {showProfileMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowProfileMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-fadeIn">
                                            {/* User Info in Dropdown */}
                                            <div className="p-4 border-b border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-lg">
                                                        {getUserInitials()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">
                                                            {user?.name || 'User'}
                                                        </p>
                                                        <p className="text-sm text-slate-300">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="p-2">
                                                <button 
                                                    onClick={() => {
                                                        router.push('/profile')
                                                        setShowProfileMenu(false)
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-300 text-sm"
                                                >
                                                    <FaUser className="text-slate-400" />
                                                    View Profile
                                                </button>
                                            </div>

                                            {/* Logout Button */}
                                            <div className="p-4 border-t border-slate-700/50">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-400 hover:text-white hover:from-red-600/30 hover:to-red-700/30 border border-red-800/30 hover:border-red-700/50 transition-all duration-300 text-sm font-medium group"
                                                >
                                                    <FaSignOutAlt className="group-hover:rotate-180 transition-transform duration-500" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden border-t border-slate-800/50 mt-2 pt-2">
                        <div className="flex justify-around">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => router.push(item.href)}
                                        className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                                            isActive
                                                ? 'text-blue-400'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-xs mt-1">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Add custom animation */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </>
    )
}

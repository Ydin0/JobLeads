'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    User,
    CreditCard,
    Building2,
    Bell,
    Check,
    ChevronRight,
    ExternalLink,
    Mail,
    Shield,
    Key,
    Sparkles,
    Download,
    Plus,
    Trash2,
    Crown,
    Zap,
    AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PricingModal } from '@/components/dashboard/pricing-modal'

const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'organization', name: 'Organization', icon: Building2 },
    { id: 'notifications', name: 'Notifications', icon: Bell },
]

const currentPlan = {
    id: 'free',
    name: 'Free',
    price: '$0',
    credits: 30,
    creditsUsed: 12,
    renewsAt: null,
}

const invoices = [
    { id: '1', date: 'Dec 1, 2024', amount: '$0.00', status: 'paid', plan: 'Free' },
]

const teamMembers = [
    { id: '1', name: 'You', email: 'you@example.com', role: 'Owner', avatar: 'Y' },
]

const usageHistory = [
    { date: 'Today', action: 'Company enrichment', credits: 3, company: 'OpenAI' },
    { date: 'Today', action: 'Company enrichment', credits: 3, company: 'Stripe' },
    { date: 'Yesterday', action: 'Search run', credits: 5, company: null },
    { date: 'Dec 10', action: 'Company enrichment', credits: 3, company: 'Meta' },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

    // Form states
    const [profileForm, setProfileForm] = useState({
        name: 'John Doe',
        email: 'john@example.com',
    })

    const [notificationSettings, setNotificationSettings] = useState({
        searchComplete: true,
        newLeads: true,
        weeklyDigest: false,
        productUpdates: true,
        billingAlerts: true,
    })

    const creditsPercentage = (currentPlan.creditsUsed / currentPlan.credits) * 100

    return (
        <div className="space-y-4">
            <PricingModal
                open={isPricingModalOpen}
                onOpenChange={setIsPricingModalOpen}
                currentPlan={currentPlan.id}
            />

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white">Settings</h1>
                <p className="text-sm text-white/40">Manage your account and preferences</p>
            </div>

            <div className="flex gap-4">
                {/* Sidebar Tabs */}
                <div className="w-48 shrink-0">
                    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                                        activeTab === tab.id
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                    )}>
                                    <tab.icon className="size-3.5" />
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <>
                            {/* Profile Info */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Profile Information</h2>
                                    <p className="text-xs text-white/40">Update your personal details</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xl font-medium text-white ring-1 ring-inset ring-white/10">
                                            {profileForm.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10">
                                                Change Avatar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-white">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-white">Email</label>
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button size="sm" className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Security</h2>
                                    <p className="text-xs text-white/40">Manage your security settings</p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                                                <Key className="size-4 text-white/40" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">Password</div>
                                                <div className="text-xs text-white/40">Last changed 30 days ago</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                            Change
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                                                <Shield className="size-4 text-white/40" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">Two-Factor Authentication</div>
                                                <div className="text-xs text-white/40">Add an extra layer of security</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                            Enable
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <>
                            {/* Current Plan */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/5 blur-3xl" />
                                <div className="relative border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Current Plan</h2>
                                    <p className="text-xs text-white/40">Manage your subscription</p>
                                </div>
                                <div className="relative p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                                                <Sparkles className="size-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold text-white">{currentPlan.name}</span>
                                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">Current</span>
                                                </div>
                                                <div className="text-xs text-white/40">{currentPlan.price}/month</div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsPricingModalOpen(true)}
                                            className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 px-3 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                            <Crown className="mr-1.5 size-3" />
                                            Upgrade Plan
                                        </Button>
                                    </div>

                                    {/* Credits Usage */}
                                    <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-white">Credits Usage</span>
                                            <span className="text-xs text-white/40">{currentPlan.creditsUsed} / {currentPlan.credits} credits</span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                style={{ width: `${creditsPercentage}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-white/30">
                                            <span>Resets monthly</span>
                                            <span>{currentPlan.credits - currentPlan.creditsUsed} credits remaining</span>
                                        </div>
                                    </div>

                                    {/* Buy More Credits */}
                                    <div className="mt-3 flex items-center justify-between rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="size-4 text-cyan-400" />
                                            <span className="text-xs text-white/70">Need more credits?</span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
                                            Buy Credits
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Usage History */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Usage History</h2>
                                    <p className="text-xs text-white/40">Recent credit usage</p>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {usageHistory.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-7 items-center justify-center rounded-lg bg-white/5">
                                                    <Sparkles className="size-3 text-white/40" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-white">{item.action}</div>
                                                    <div className="text-[10px] text-white/30">
                                                        {item.company ? item.company : 'All companies'} · {item.date}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-white/60">-{item.credits} credits</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Payment Method</h2>
                                    <p className="text-xs text-white/40">Manage your payment details</p>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 py-6">
                                        <div className="text-center">
                                            <CreditCard className="mx-auto size-8 text-white/20" />
                                            <p className="mt-2 text-xs text-white/40">No payment method on file</p>
                                            <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                                <Plus className="mr-1 size-3" />
                                                Add Payment Method
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoices */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Invoices</h2>
                                    <p className="text-xs text-white/40">Download past invoices</p>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="flex items-center justify-between px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xs text-white">{invoice.date}</div>
                                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">{invoice.plan}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-white/60">{invoice.amount}</span>
                                                <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                    {invoice.status}
                                                </span>
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/30 hover:bg-white/10 hover:text-white">
                                                    <Download className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Organization Tab */}
                    {activeTab === 'organization' && (
                        <>
                            {/* Organization Info */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Organization Details</h2>
                                    <p className="text-xs text-white/40">Manage your organization settings</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-14 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xl font-bold text-white ring-1 ring-inset ring-white/10">
                                            A
                                        </div>
                                        <div>
                                            <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10">
                                                Change Logo
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-white">Organization Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Acme Recruiting"
                                            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button size="sm" className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                                    <div>
                                        <h2 className="text-sm font-medium text-white">Team Members</h2>
                                        <p className="text-xs text-white/40">Manage who has access</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 border-white/10 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10">
                                        <Plus className="mr-1 size-3" />
                                        Invite
                                    </Button>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                                    {member.avatar}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{member.name}</div>
                                                    <div className="text-xs text-white/40">{member.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Upgrade notice for more members */}
                                <div className="border-t border-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <AlertCircle className="size-3" />
                                        <span>Upgrade to Pro to add team members</span>
                                        <button
                                            onClick={() => setIsPricingModalOpen(true)}
                                            className="text-purple-400 hover:text-purple-300">
                                            Upgrade →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/5">
                                <div className="border-b border-red-500/20 px-4 py-3">
                                    <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
                                    <p className="text-xs text-white/40">Irreversible actions</p>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-white">Delete Organization</div>
                                            <div className="text-xs text-white/40">Permanently delete all data</div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            <Trash2 className="mr-1 size-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <>
                            {/* Email Notifications */}
                            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="border-b border-white/5 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Email Notifications</h2>
                                    <p className="text-xs text-white/40">Choose what emails you receive</p>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {[
                                        { key: 'searchComplete', label: 'Search Complete', desc: 'Get notified when a search finishes running' },
                                        { key: 'newLeads', label: 'New Leads Found', desc: 'Receive alerts when new contacts are found' },
                                        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your activity every week' },
                                        { key: 'productUpdates', label: 'Product Updates', desc: 'News about new features and improvements' },
                                        { key: 'billingAlerts', label: 'Billing Alerts', desc: 'Payment reminders and usage warnings' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                                                    <Mail className="size-4 text-white/40" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{item.label}</div>
                                                    <div className="text-xs text-white/40">{item.desc}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setNotificationSettings(prev => ({
                                                    ...prev,
                                                    [item.key]: !prev[item.key as keyof typeof prev]
                                                }))}
                                                className={cn(
                                                    'relative h-5 w-9 rounded-full transition-colors',
                                                    notificationSettings[item.key as keyof typeof notificationSettings]
                                                        ? 'bg-green-500'
                                                        : 'bg-white/10'
                                                )}>
                                                <div
                                                    className={cn(
                                                        'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                                                        notificationSettings[item.key as keyof typeof notificationSettings]
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0.5'
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

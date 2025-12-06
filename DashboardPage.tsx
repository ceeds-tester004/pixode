import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { format, differenceInMinutes, isValid } from 'date-fns';
import { AuthUser } from '@supabase/supabase-js';
import LiveSupportChat from './LiveSupportChat';

// Icons
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const ProjectIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 16.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0L6 9.586V4h7v5.586l-1.293-1.293z" clipRule="evenodd" /></svg>);
const InquiryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0018 4H2a2 2 0 00-.003 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>);
const TeamIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18H4a2 2 0 01-2-2v-1h16v1a2 2 0 01-2 2z" /></svg>);
const LiveChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" /></svg>);
const SignOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h4a1 1 0 001-1V4a1 1 0 00-1-1H3zm7 0a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V4a1 1 0 011-1h4z" clipRule="evenodd" /></svg>);

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [teamMembersData, setTeamMembersData] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [actionLogs, setActionLogs] = useState<any[]>([]);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');

    // Team member management states
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);
    const [newMemberForm, setNewMemberForm] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'Employee'
    });

    const [editForm, setEditForm] = useState({
        title: '',
        type: '',
        image: '',
        overview: '',
        challenges: '',
        approach: '',
        results: '',
        technologies: '',
    });

    const AnimatedSection: React.FC<React.PropsWithChildren<{ delay?: number }>> = ({ children, delay = 0 }) => {
        const ref = useRef<HTMLDivElement>(null);
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const element = ref.current;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                },
                { threshold: 0.1 }
            );

            if (element) {
                observer.observe(element);
            }

            return () => {
                if (element) {
                    observer.unobserve(element);
                }
            };
        }, []);

        return (
            <div
                ref={ref}
                className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${delay}ms` }}
            >
                {children}
            </div>
        );
    };

    const isCEO = profile?.role === 'CEO';
    const isAdminOrCEO = profile && (profile.role === 'CEO' || profile.role === 'Admin' || profile.role === 'Co-Founder');

    // Action logging helper
    const logAction = async (actionType: string, actionDetails: any = {}) => {
        if (!user) return;
        try {
            await supabase.from('action_logs').insert({
                user_id: user.id,
                action_type: actionType,
                action_details: actionDetails
            });
        } catch (error) {
            console.error('Failed to log action:', error);
        }
    };

    const fetchUserAndProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (error) {
                console.error("Error fetching profile:", error.message);
                if (error.code === 'PGRST116') {
                    const { data: newProfile, error: newProfileError } = await supabase.from('profiles').insert({
                        id: user.id,
                        full_name: user.user_metadata.full_name || 'New User',
                        email: user.email,
                        role: 'Employee'
                    }).select().single();
                    if (newProfileError) console.error("Error creating default profile:", newProfileError.message);
                    else setProfile(newProfile);
                }
            } else {
                setProfile(data);
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchInquiries = useCallback(async () => {
        if (!isAdminOrCEO) return;
        let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
        if (inquiryStatusFilter !== 'all') {
            query = query.eq('status', inquiryStatusFilter);
        }
        const { data, error } = await query;
        if (error) console.error("Error fetching inquiries:", error.message);
        else setInquiries(data || []);
    }, [isAdminOrCEO, inquiryStatusFilter]);

    const fetchProjects = useCallback(async () => {
        setIsProjectLoading(true);
        setProjectError(null);
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching projects:", error.message);
            setProjectError("Failed to load projects.");
        } else {
            setProjects(data || []);
        }
        setIsProjectLoading(false);
    }, []);

    const fetchTeamMembers = useCallback(async () => {
        if (!isAdminOrCEO) return;
        const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
        if (error) console.error("Error fetching team members:", error.message);
        else setTeamMembersData(data || []);
    }, [isAdminOrCEO]);

    const fetchAttendance = useCallback(async () => {
        if (!isAdminOrCEO) return;
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*, profiles(full_name, email)')
            .order('date', { ascending: false })
            .order('clock_in_time', { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error fetching attendance:", error.message);
        } else {
            setAttendanceRecords(data || []);
        }
    }, [isAdminOrCEO]);

    const fetchActionLogs = useCallback(async () => {
        if (!isCEO) return;
        const { data, error } = await supabase
            .from('action_logs')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error("Error fetching action logs:", error.message);
        } else {
            setActionLogs(data || []);
        }
    }, [isCEO]);

    useEffect(() => {
        fetchUserAndProfile();
    }, [fetchUserAndProfile]);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        fetchActionLogs();
    }, [fetchActionLogs]);

    const handleSignOut = async () => {
        await logAction('logout', {});
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error signing out:", error.message);
        navigate('/login');
    };

    const handleMarkAsRead = async (id: number) => {
        const { error } = await supabase.from('inquiries').update({ status: 'read' }).eq('id', id);
        if (error) console.error("Error marking inquiry as read:", error.message);
        else {
            await logAction('inquiry_marked_read', { inquiry_id: id });
            fetchInquiries();
        }
    };

    const handleArchiveInquiry = async (id: number) => {
        const { error } = await supabase.from('inquiries').update({ status: 'archived' }).eq('id', id);
        if (error) console.error("Error archiving inquiry:", error.message);
        else {
            await logAction('inquiry_archived', { inquiry_id: id });
            fetchInquiries();
        }
    };

    const handleProjectEdit = (project: any) => {
        setEditingProject(project);
        setEditForm({
            title: project.title,
            type: project.type,
            image: project.image,
            overview: project.overview,
            challenges: project.challenges || '',
            approach: project.approach || '',
            results: project.results || '',
            technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : '',
        });
        setShowEditModal(true);
    };

    const handleProjectDelete = (project: any) => {
        setProjectToDelete(project);
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsProjectLoading(true);
        setProjectError(null);
        const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
        if (error) {
            console.error("Error deleting project:", error.message);
            setProjectError("Failed to delete project.");
        } else {
            await logAction('project_deleted', { project_title: projectToDelete.title });
            fetchProjects();
            setProjectToDelete(null);
            setShowConfirmDeleteModal(false);
        }
        setIsProjectLoading(false);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        setIsProjectLoading(true);
        setProjectError(null);

        const technologiesArray = editForm.technologies.split(',').map(tech => tech.trim()).filter(tech => tech !== '');

        const projectData = {
            title: editForm.title,
            type: editForm.type,
            image: editForm.image,
            overview: editForm.overview,
            challenges: editForm.challenges,
            approach: editForm.approach,
            results: editForm.results,
            technologies: technologiesArray,
        };

        let error;
        if (editingProject.id === 'new') {
            const result = await supabase.from('projects').insert(projectData);
            error = result.error;
            if (!error) {
                await logAction('project_created', { project_title: editForm.title });
            }
        } else {
            const result = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
            error = result.error;
            if (!error) {
                await logAction('project_updated', { project_title: editForm.title });
            }
        }

        if (error) {
            console.error(`Error ${editingProject.id === 'new' ? 'creating' : 'updating'} project:`, error.message);
            setProjectError(`Failed to ${editingProject.id === 'new' ? 'create' : 'update'} project.`);
        } else {
            setShowEditModal(false);
            setEditingProject(null);
            fetchProjects();
        }
        setIsProjectLoading(false);
    };

    const handleClockIn = async () => {
        if (!user) return;
        const today = format(new Date(), 'yyyy-MM-dd');

        const { data: existingRecord, error: fetchError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .is('clock_out_time', null)
            .maybeSingle();

        if (fetchError) {
            console.error("Error checking existing attendance:", fetchError.message);
            alert("Error checking attendance status.");
            return;
        }

        if (existingRecord) {
            alert("You are already clocked in for today!");
            return;
        }

        const { error } = await supabase.from('attendance_records').insert({ user_id: user.id, date: today });
        if (error) {
            console.error("Error clocking in:", error.message);
            alert("Failed to clock in. " + error.message);
        } else {
            await logAction('clock_in', { date: today });
            alert("Clocked in successfully!");
            fetchAttendance();
        }
    };

    const handleClockOut = async () => {
        if (!user) return;
        const today = format(new Date(), 'yyyy-MM-dd');

        const { data: recordToUpdate, error: fetchError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .is('clock_out_time', null)
            .maybeSingle();

        if (fetchError) {
            console.error("Error fetching record to clock out:", fetchError.message);
            alert("Error fetching record to clock out.");
            return;
        }

        if (!recordToUpdate) {
            alert("You are not currently clocked in for today.");
            return;
        }

        const { error } = await supabase.from('attendance_records')
            .update({ clock_out_time: new Date().toISOString() })
            .eq('id', recordToUpdate.id);

        if (error) {
            console.error("Error clocking out:", error.message);
            alert("Failed to clock out. " + error.message);
        } else {
            await logAction('clock_out', { date: today });
            alert("Clocked out successfully!");
            fetchAttendance();
        }
    };

    const calculateHoursWorked = (clockIn: string, clockOut: string | null) => {
        if (!clockOut) return 'Ongoing';
        const inTime = new Date(clockIn);
        const outTime = new Date(clockOut);

        if (!isValid(inTime) || !isValid(outTime)) return 'Invalid';

        const diffMinutes = differenceInMinutes(outTime, inTime);
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data, error } = await supabase.auth.signUp({
            email: newMemberForm.email,
            password: newMemberForm.password,
            options: {
                data: {
                    full_name: newMemberForm.full_name,
                    role: newMemberForm.role
                }
            }
        });

        if (error) {
            alert('Failed to add team member: ' + error.message);
            return;
        }

        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: newMemberForm.full_name,
                role: newMemberForm.role,
                email: newMemberForm.email
            });

            await logAction('team_member_added', {
                member_email: newMemberForm.email,
                member_name: newMemberForm.full_name,
                member_role: newMemberForm.role
            });

            alert('Team member added successfully!');
            setShowAddMemberModal(false);
            setNewMemberForm({ email: '', password: '', full_name: '', role: 'Employee' });
            fetchTeamMembers();
        }
    };

    const handleDeleteMember = (member: any) => {
        if (member.role === 'CEO') {
            alert('Cannot delete the CEO account!');
            return;
        }
        setMemberToDelete(member);
        setShowDeleteMemberModal(true);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('You must be logged in to delete team members.');
                return;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mogdizazsjmlrtdsqxfl.supabase.co';
            const apiUrl = `${supabaseUrl}/functions/v1/delete-team-member`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: memberToDelete.id })
            });

            const result = await response.json();

            if (!response.ok) {
                alert('Failed to delete team member: ' + (result.error || 'Unknown error'));
                return;
            }

            await logAction('team_member_deleted', {
                member_email: memberToDelete.email,
                member_name: memberToDelete.full_name,
                member_role: memberToDelete.role
            });

            alert('Team member deleted successfully!');
            setShowDeleteMemberModal(false);
            setMemberToDelete(null);
            fetchTeamMembers();
        } catch (error: any) {
            console.error('Delete member error:', error);
            alert('Failed to delete team member: ' + error.message);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a031a]">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a031a] text-white">
            <aside className="w-64 bg-[#110e1a] border-r border-purple-500/20 p-6 flex flex-col">
                <div className="flex items-center mb-10">
                    <Link to="/" className="text-3xl font-bold font-montserrat animate-text-lights" title="Back to Home">
                        PIXODE
                    </Link>
                </div>
                <nav className="flex-1">
                    <ul>
                        <li className="mb-2">
                            <button onClick={() => setActiveTab('home')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'home' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                <HomeIcon /> Home
                            </button>
                        </li>
                        {isAdminOrCEO && (
                            <>
                                <li className="mb-2">
                                    <button onClick={() => setActiveTab('inquiries')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'inquiries' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                        <InquiryIcon /> Inquiries
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button onClick={() => setActiveTab('projects')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'projects' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                        <ProjectIcon /> Projects
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button onClick={() => setActiveTab('team')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'team' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                        <TeamIcon /> Team
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button onClick={() => setActiveTab('attendance')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'attendance' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                        <ClockIcon /> Attendance
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button onClick={() => setActiveTab('livechat')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'livechat' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                        <LiveChatIcon /> Live Chat
                                    </button>
                                </li>
                            </>
                        )}
                        {isCEO && (
                            <li className="mb-2">
                                <button onClick={() => setActiveTab('history')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'history' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                                    <HistoryIcon /> Action History
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="mt-auto">
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 text-red-400 hover:bg-white/10 transition-colors">
                        <SignOutIcon /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 pt-10 overflow-auto">
                {activeTab === 'home' && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Dashboard Home</h1>
                        {profile && (
                            <p className="text-lg text-gray-300 mb-4">Welcome back, {profile.full_name || user.email}!</p>
                        )}
                        <p className="text-gray-400">Your role: <span className="font-semibold text-purple-400">{profile?.role || 'Loading...'}</span></p>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isAdminOrCEO && (
                                <>
                                    <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                                        <h2 className="text-xl font-semibold mb-2">Total Inquiries</h2>
                                        <p className="text-3xl font-bold animate-text-lights">{inquiries.length}</p>
                                        <Link to="#" onClick={() => setActiveTab('inquiries')} className="text-purple-400 hover:underline text-sm mt-2 block">View all inquiries</Link>
                                    </div>
                                    <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                                        <h2 className="text-xl font-semibold mb-2">Total Projects</h2>
                                        <p className="text-3xl font-bold animate-text-lights">{projects.length}</p>
                                        <Link to="#" onClick={() => setActiveTab('projects')} className="text-purple-400 hover:underline text-sm mt-2 block">Manage projects</Link>
                                    </div>
                                </>
                            )}
                            <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20 col-span-1 md:col-span-2 lg:col-span-1">
                                <h2 className="text-xl font-semibold mb-2">My Attendance</h2>
                                <div className="flex gap-4 mt-4">
                                    <button onClick={handleClockIn} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors">
                                        Clock In
                                    </button>
                                    <button onClick={handleClockOut} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors">
                                        Clock Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'inquiries' && isAdminOrCEO && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Customer Inquiries</h1>
                        <div className="mb-6 flex gap-4">
                            <button onClick={() => setInquiryStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${inquiryStatusFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>All</button>
                            <button onClick={() => setInquiryStatusFilter('new')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${inquiryStatusFilter === 'new' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>New</button>
                            <button onClick={() => setInquiryStatusFilter('read')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${inquiryStatusFilter === 'read' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Read</button>
                            <button onClick={() => setInquiryStatusFilter('archived')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${inquiryStatusFilter === 'archived' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Archived</button>
                        </div>
                        <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                            {inquiries.length === 0 ? (
                                <p className="text-gray-400">No inquiries found for the selected filter.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {inquiries.map(inquiry => (
                                        <li key={inquiry.id} className={`p-4 rounded-lg border border-white/10 ${inquiry.status === 'new' ? 'bg-purple-900/20' : ''}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{inquiry.subject}</h3>
                                                    <p className="text-sm text-gray-400">{inquiry.name} ({inquiry.email})</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    inquiry.status === 'new' ? 'bg-green-500/20 text-green-300' :
                                                    inquiry.status === 'read' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-gray-500/20 text-gray-300'
                                                }`}>
                                                    {inquiry.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 mt-2">{inquiry.message}</p>
                                            <p className="text-xs text-gray-500 mt-2">Received: {format(new Date(inquiry.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                            <div className="mt-4 flex gap-2">
                                                {inquiry.status === 'new' && (
                                                    <button onClick={() => handleMarkAsRead(inquiry.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">Mark as Read</button>
                                                )}
                                                {inquiry.status !== 'archived' && (
                                                    <button onClick={() => handleArchiveInquiry(inquiry.id)} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors">Archive</button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'projects' && isAdminOrCEO && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Manage Projects</h1>
                        {isProjectLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {projectError && <p className="text-red-400 mb-4">{projectError}</p>}
                        <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                            {projects.length === 0 ? (
                                <p className="text-gray-400">No projects added yet.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {projects.map(project => (
                                        <li key={project.id} className="p-4 rounded-lg border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                                                <p className="text-sm text-gray-400">{project.type}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleProjectEdit(project)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">Edit</button>
                                                <button onClick={() => handleProjectDelete(project)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors">Delete</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button onClick={() => handleProjectEdit({ id: 'new', title: '', type: '', image: '', overview: '', challenges: '', approach: '', results: '', technologies: [] })} className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors">Add New Project</button>
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'team' && isAdminOrCEO && (
                    <AnimatedSection>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-4xl font-bold font-montserrat animate-text-lights">Team Management</h1>
                            {isCEO && (
                                <button onClick={() => setShowAddMemberModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors">
                                    Add Team Member
                                </button>
                            )}
                        </div>
                        <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                            {teamMembersData.length === 0 ? (
                                <p className="text-gray-400">No team members found.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {teamMembersData.map(member => (
                                        <li key={member.id} className="p-4 rounded-lg border border-white/10 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <img src={member.image || 'https://via.placeholder.com/40'} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{member.full_name}</h3>
                                                    <p className="text-sm text-gray-400">{member.email}</p>
                                                    <p className="text-xs text-purple-400">{member.role}</p>
                                                </div>
                                            </div>
                                            {isCEO && member.role !== 'CEO' && (
                                                <button onClick={() => handleDeleteMember(member)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors">
                                                    Delete
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'attendance' && isAdminOrCEO && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Attendance Records</h1>
                        <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                            {attendanceRecords.length === 0 ? (
                                <p className="text-gray-400">No attendance records found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clock In</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clock Out</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {attendanceRecords.map(record => (
                                                <tr key={record.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{record.profiles?.full_name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{format(new Date(record.clock_in_time), 'HH:mm')}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{record.clock_out_time ? format(new Date(record.clock_out_time), 'HH:mm') : 'Ongoing'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-300">{calculateHoursWorked(record.clock_in_time, record.clock_out_time)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'livechat' && isAdminOrCEO && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Live Customer Support</h1>
                        <div className="h-[70vh] bg-[#1a142e] rounded-lg shadow-xl border border-purple-500/20">
                            <LiveSupportChat isDashboardContext={true} />
                        </div>
                    </AnimatedSection>
                )}

                {activeTab === 'history' && isCEO && (
                    <AnimatedSection>
                        <h1 className="text-4xl font-bold font-montserrat animate-text-lights mb-8">Employee Action History</h1>
                        <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20">
                            {actionLogs.length === 0 ? (
                                <p className="text-gray-400">No action history found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {actionLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{log.profiles?.full_name || 'Unknown'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                                                            {log.action_type.replace(/_/g, ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-400">
                                                        {Object.keys(log.action_details).length > 0 ? (
                                                            <code className="text-xs">{JSON.stringify(log.action_details)}</code>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </AnimatedSection>
                )}
            </main>

            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20 w-full max-w-md my-8">
                        <h2 className="text-xl font-bold font-montserrat mb-4 animate-text-lights">{editingProject.id === 'new' ? 'Add New Project' : `Edit Project: ${editingProject.title}`}</h2>
                        {isProjectLoading && (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {projectError && <p className="text-red-400 mb-3">{projectError}</p>}
                        <form onSubmit={handleUpdateProject} className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="title" className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                                <input type="text" name="title" id="title" value={editForm.title} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-xs font-medium text-gray-300 mb-1">Type</label>
                                <input type="text" name="type" id="type" value={editForm.type} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm" placeholder="e.g., Web Development" required />
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-xs font-medium text-gray-300 mb-1">Image URL</label>
                                <input type="url" name="image" id="image" value={editForm.image} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="overview" className="block text-xs font-medium text-gray-300 mb-1">Overview</label>
                                <textarea name="overview" id="overview" rows={2} value={editForm.overview} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm" required></textarea>
                            </div>
                            <div>
                                <label htmlFor="challenges" className="block text-xs font-medium text-gray-300 mb-1">Challenges</label>
                                <textarea name="challenges" id="challenges" rows={2} value={editForm.challenges} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="approach" className="block text-xs font-medium text-gray-300 mb-1">Approach</label>
                                <textarea name="approach" id="approach" rows={2} value={editForm.approach} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="results" className="block text-xs font-medium text-gray-300 mb-1">Results</label>
                                <textarea name="results" id="results" rows={2} value={editForm.results} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="technologies" className="block text-xs font-medium text-gray-300 mb-1">Technologies (comma separated)</label>
                                <input type="text" name="technologies" id="technologies" value={editForm.technologies} onChange={handleEditFormChange} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm" placeholder="React, Node.js, Tailwind CSS" />
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-semibold transition-colors">Cancel</button>
                                <button type="submit" disabled={isProjectLoading} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConfirmDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a142e] p-8 rounded-lg shadow-xl border border-red-500/20 w-full max-w-sm text-center">
                        <h2 className="text-2xl font-bold font-montserrat mb-4 text-red-400">Confirm Deletion</h2>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete project "<span className="font-semibold">{projectToDelete?.title}</span>"? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button type="button" onClick={() => setShowConfirmDeleteModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors">Cancel</button>
                            <button type="button" onClick={confirmDeleteProject} disabled={isProjectLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#1a142e] p-6 rounded-lg shadow-xl border border-purple-500/20 w-full max-w-md my-8">
                        <h2 className="text-xl font-bold font-montserrat mb-4 animate-text-lights">Add Team Member</h2>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <input type="text" name="full_name" id="full_name" value={newMemberForm.full_name} onChange={(e) => setNewMemberForm(prev => ({ ...prev, full_name: e.target.value }))} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input type="email" name="email" id="email" value={newMemberForm.email} onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input type="password" name="password" id="password" value={newMemberForm.password} onChange={(e) => setNewMemberForm(prev => ({ ...prev, password: e.target.value }))} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" required minLength={6} />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                <select name="role" id="role" value={newMemberForm.role} onChange={(e) => setNewMemberForm(prev => ({ ...prev, role: e.target.value }))} className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                                    <option value="Employee">Employee</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Co-Founder">Co-Founder</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-semibold transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-semibold transition-colors">Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a142e] p-8 rounded-lg shadow-xl border border-red-500/20 w-full max-w-sm text-center">
                        <h2 className="text-2xl font-bold font-montserrat mb-4 text-red-400">Confirm Deletion</h2>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete "<span className="font-semibold">{memberToDelete?.full_name}</span>"? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button type="button" onClick={() => setShowDeleteMemberModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors">Cancel</button>
                            <button type="button" onClick={confirmDeleteMember} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;

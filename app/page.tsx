"use client";
import { useState, useEffect } from 'react';
import './globals.css';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [shareEmails, setShareEmails] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') fetchAuditLogs();
      else fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    const res = await fetch(`/api/documents?userId=${user.id}`);
    const data = await res.json();
    if (data.documents) setDocuments(data.documents);
  };

  const fetchAuditLogs = async () => {
    const res = await fetch(`/api/audit?userId=${user.id}`);
    const data = await res.json();
    if (data.logs) setAuditLogs(data.logs);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    else alert('Login failed: Invalid credentials');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: uploadName,
        category: uploadCategory || 'GENERAL',
        storagePath: `vault/${Date.now()}_${uploadName}` 
      })
    });
    if (res.ok) {
      setUploadName('');
      setUploadCategory('');
      fetchDocuments();
    }
  };

  const handleDownload = async (documentId: string) => {
    const res = await fetch(`/api/documents/${documentId}/download?userId=${user.id}`);
    const data = await res.json();
    if (data.success) alert(`Access Granted! Secure Link:\n\n${data.downloadUrl}`);
    else alert(`Blocked: ${data.error}`);
  };

  const handlePermission = async (documentId: string, action: 'GRANT' | 'REVOKE') => {
    const targetEmail = shareEmails[documentId];
    if (!targetEmail) return alert("Please enter an email address first.");

    const res = await fetch(`/api/documents/${documentId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: user.id, targetEmail, accessLevel: 'READ', action
      })
    });
    
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      setShareEmails({ ...shareEmails, [documentId]: '' });
    } else {
      alert(`Failed: ${data.error}`);
    }
  };

  if (user) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {/* Interactive Navbar */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner shadow-blue-400/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">TrustVault</h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">{user.role} PORTAL</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700">{user.email}</span>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  Secure Session Active
                </span>
              </div>
              <button onClick={() => setUser(null)} className="flex items-center gap-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all px-4 py-2.5 rounded-lg text-sm font-semibold active:scale-95 border border-transparent hover:border-rose-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {user.role === 'ADMIN' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Immutable Audit Trail</h2>
                  <p className="text-xs text-slate-500 font-medium">Cryptographic hash chain verifying all system activity.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4 pl-6">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actor</th>
                      <th className="p-4 pr-6">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6 whitespace-nowrap text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-4 font-semibold text-slate-700">{log.action}</td>
                        <td className="p-4">
                          {log.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> DENIED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{log.actor?.email || 'System'}</td>
                        <td className="p-4 pr-6 font-mono text-xs text-slate-400 group-hover:text-slate-600 transition-colors truncate max-w-[200px]" title={log.currentHash}>
                          {log.currentHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Upload Card */}
              <div className="lg:col-span-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-28 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Secure Upload</h2>
                      <p className="text-xs text-slate-500 font-medium">Encrypt and vault a new file.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleUpload} className="flex flex-col gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Document Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <input type="text" placeholder="e.g., Q3_Financials.pdf" value={uploadName} onChange={e => setUploadName(e.target.value)} className="w-full pl-10 border border-slate-200 bg-slate-50 hover:bg-white p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Category Tag</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        </div>
                        <input type="text" placeholder="e.g., FINANCE, HR" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full pl-10 border border-slate-200 bg-slate-50 hover:bg-white p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner" />
                      </div>
                    </div>
                    <button type="submit" className="mt-2 bg-blue-600 text-white p-3.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 transition-all flex justify-center items-center gap-2 group">
                      Vault Document
                      <svg className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </button>
                  </form>
                </div>
              </div>

              {/* Document List */}
              <div className="lg:col-span-8">
                <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Vault</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage and securely share your files.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    {documents.length} Files
                  </div>
                </div>
                
                {documents.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    </div>
                    <p className="text-slate-600 font-bold text-lg">Your vault is empty</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">Upload a document securely using the form to encrypt it into your vault.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {documents.map(doc => (
                      <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                        <div className="p-6 flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className="mt-1 p-3 bg-blue-50/50 group-hover:bg-blue-100 text-blue-600 rounded-xl transition-colors border border-blue-100">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{doc.name}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                  {doc.category || 'GENERAL'}
                                </span>
                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 border-l border-slate-200 pl-3">
                                  Access: 
                                  <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold ${doc.accessLevel === 'EDIT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {doc.accessLevel === 'EDIT' ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>}
                                    {doc.accessLevel}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(doc.id)} className="flex items-center gap-2 text-sm bg-white border-2 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 px-5 py-2.5 rounded-xl hover:bg-blue-50 active:scale-95 shadow-sm transition-all font-bold group/btn">
                            <svg className="w-4 h-4 group-hover/btn:translate-y-[2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download
                          </button>
                        </div>
                        
                        {doc.accessLevel === 'EDIT' && (
                          <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="w-full sm:w-auto flex-1">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Access Control Management</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <input type="email" placeholder="User email to share with..." value={shareEmails[doc.id] || ''} onChange={e => setShareEmails({...shareEmails, [doc.id]: e.target.value})} className="w-full border border-slate-200 bg-white pl-9 p-2.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" />
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-6">
                              <button onClick={() => handlePermission(doc.id, 'GRANT')} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-lg hover:bg-emerald-600 hover:text-white active:scale-95 font-bold transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                Grant Read
                              </button>
                              <button onClick={() => handlePermission(doc.id, 'REVOKE')} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-lg hover:bg-rose-600 hover:text-white active:scale-95 font-bold transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
                                Revoke
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Enhanced Login Screen
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>

      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 relative z-10 transition-all">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-50">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">TrustVault</h1>
          <p className="text-slate-500 mt-2 font-medium">Enterprise-grade secure document sharing.</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
              </div>
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 border border-slate-200 bg-slate-50 hover:bg-white p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 border border-slate-200 bg-slate-50 hover:bg-white p-3.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
            </div>
          </div>
          <button type="submit" className="mt-2 bg-slate-900 text-white p-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all flex justify-center items-center gap-2 group">
            Secure Sign In
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Fast Login (For Judges)</p>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setEmail('owner@trustvault.com')} className="flex items-center gap-3 text-sm text-left text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-all font-semibold active:scale-[0.98]">
              <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100 text-blue-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
              owner@trustvault.com
            </button>
            <button onClick={() => setEmail('viewer@trustvault.com')} className="flex items-center gap-3 text-sm text-left text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all font-semibold active:scale-[0.98]">
              <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100 text-emerald-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></div>
              viewer@trustvault.com
            </button>
            <button onClick={() => setEmail('admin@trustvault.com')} className="flex items-center gap-3 text-sm text-left text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all font-semibold active:scale-[0.98]">
              <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100 text-indigo-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
              admin@trustvault.com
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
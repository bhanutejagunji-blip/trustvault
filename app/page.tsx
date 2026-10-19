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
      <main className="min-h-screen bg-slate-50 font-sans">
        {/* Sleek Top Navigation */}
        <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl tracking-tighter">T</div>
              <h1 className="text-xl font-bold tracking-wide">TrustVault <span className="font-light text-slate-400">| {user.role === 'ADMIN' ? 'Admin' : 'Portal'}</span></h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold">{user.email}</span>
                <span className="text-xs text-blue-300 font-mono bg-slate-800/50 px-2 py-0.5 rounded mt-1">ROLE: {user.role}</span>
              </div>
              <button onClick={() => setUser(null)} className="bg-slate-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-md text-sm font-medium">Logout</button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {user.role === 'ADMIN' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-800">Cryptographic Audit Trail</h2>
                <p className="text-sm text-slate-500 mt-1">Immutable ledger of all system activity. Protected by SHA-256 hash chains.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-semibold">Timestamp</th>
                      <th className="p-4 font-semibold">Action</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Actor</th>
                      <th className="p-4 font-semibold">Integrity Hash (SHA-256)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 whitespace-nowrap text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-4 font-medium text-slate-900">{log.action}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4">{log.actor?.email || 'System'}</td>
                        <td className="p-4 font-mono text-xs text-slate-400 truncate max-w-[200px]" title={log.currentHash}>
                          {log.currentHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Card */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Secure Upload</h2>
                  <p className="text-xs text-slate-500 mb-6">Files are instantly encrypted and locked to your account.</p>
                  
                  <form onSubmit={handleUpload} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Document Name</label>
                      <input type="text" placeholder="e.g., Q3_Financials.pdf" value={uploadName} onChange={e => setUploadName(e.target.value)} className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Category</label>
                      <input type="text" placeholder="e.g., FINANCE" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <button type="submit" className="mt-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Encrypt & Upload
                    </button>
                  </form>
                </div>
              </div>

              {/* Document List */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">My Vault</h2>
                  <span className="text-sm text-slate-500">{documents.length} secure files</span>
                </div>
                
                {documents.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <p className="text-slate-500 font-medium">Your vault is empty.</p>
                    <p className="text-sm text-slate-400 mt-1">Upload a document to get started.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-lg">{doc.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{doc.category}</span>
                                <span className="text-xs text-slate-400 border-l pl-3">Access: <span className="font-mono text-blue-600 font-semibold">{doc.accessLevel}</span></span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(doc.id)} className="flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 shadow-sm transition-colors font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download
                          </button>
                        </div>
                        
                        {doc.accessLevel === 'EDIT' && (
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-xl">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Manage Access</label>
                            <div className="flex gap-2">
                              <input type="email" placeholder="User email to share with..." value={shareEmails[doc.id] || ''} onChange={e => setShareEmails({...shareEmails, [doc.id]: e.target.value})} className="border border-slate-200 bg-white p-2 text-sm rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                              <button onClick={() => handlePermission(doc.id, 'GRANT')} className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm font-semibold transition-colors">Grant Read</button>
                              <button onClick={() => handlePermission(doc.id, 'REVOKE')} className="text-xs bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 shadow-sm font-semibold transition-colors">Revoke</button>
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

      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">TrustVault</h1>
        <p className="text-slate-500 mb-8 font-medium">Enterprise-grade secure document sharing.</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Email Address</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
          </div>
          <button type="submit" className="mt-2 bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 font-semibold shadow-md transition-all">
            Secure Sign In
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Test Accounts (Pass: password123)</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => setEmail('owner@trustvault.com')} className="text-xs text-left text-slate-600 hover:text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 hover:border-blue-200 transition-colors">👩‍💼 owner@trustvault.com</button>
            <button onClick={() => setEmail('viewer@trustvault.com')} className="text-xs text-left text-slate-600 hover:text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 hover:border-blue-200 transition-colors">👁️ viewer@trustvault.com</button>
            <button onClick={() => setEmail('admin@trustvault.com')} className="text-xs text-left text-slate-600 hover:text-blue-600 bg-slate-50 p-2 rounded border border-slate-100 hover:border-blue-200 transition-colors">🛡️ admin@trustvault.com</button>
          </div>
        </div>
      </div>
    </main>
  );
}
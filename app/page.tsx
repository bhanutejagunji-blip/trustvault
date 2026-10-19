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
      if (user.role === 'ADMIN') {
        fetchAuditLogs();
      } else {
        fetchDocuments();
      }
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
      <main className="min-h-screen bg-gray-50 p-10">
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">TrustVault {user.role === 'ADMIN' && 'Admin Panel'}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Role: {user.role}</span>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={() => setUser(null)} className="text-sm text-red-600 hover:underline font-medium">Logout</button>
            </div>
          </div>
          
          {user.role === 'ADMIN' ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Cryptographic Audit Trail</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 border">
                  <thead className="bg-gray-100 text-gray-900">
                    <tr>
                      <th className="p-3 border-b">Timestamp</th>
                      <th className="p-3 border-b">Action</th>
                      <th className="p-3 border-b">Status</th>
                      <th className="p-3 border-b">Actor</th>
                      <th className="p-3 border-b">Integrity Hash (SHA-256)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-semibold">{log.action}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs text-white ${log.status === 'SUCCESS' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3">{log.actor?.email || 'Anonymous/System'}</td>
                        <td className="p-3 font-mono text-xs truncate max-w-[200px]" title={log.currentHash}>
                          {log.currentHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-1 bg-gray-50 p-6 rounded border h-fit">
                <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
                <form onSubmit={handleUpload} className="flex flex-col gap-3">
                  <input type="text" placeholder="Document Name" value={uploadName} onChange={e => setUploadName(e.target.value)} className="border p-2 rounded text-sm" required />
                  <input type="text" placeholder="Category" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="border p-2 rounded text-sm" />
                  <button type="submit" className="bg-blue-900 text-white p-2 rounded text-sm font-semibold hover:bg-blue-800">Secure Upload</button>
                </form>
              </div>

              <div className="col-span-2">
                <h2 className="text-lg font-semibold mb-4">My Documents</h2>
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents found.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="border p-4 rounded bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">Access: <span className="font-mono bg-gray-100 px-1 rounded">{doc.accessLevel}</span></p>
                          </div>
                          <button onClick={() => handleDownload(doc.id)} className="text-sm bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700">Download</button>
                        </div>
                        
                        {doc.accessLevel === 'EDIT' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <input type="email" placeholder="User email to share with..." value={shareEmails[doc.id] || ''} onChange={e => setShareEmails({...shareEmails, [doc.id]: e.target.value})} className="border p-1 text-sm rounded flex-1" />
                            <button onClick={() => handlePermission(doc.id, 'GRANT')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Grant Read</button>
                            <button onClick={() => handlePermission(doc.id, 'REVOKE')} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Revoke</button>
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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TrustVault</h1>
        <p className="text-gray-600 mb-6">Sign in to access your secure documents.</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-300 p-2 rounded" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border border-gray-300 p-2 rounded" required />
          <button type="submit" className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 font-semibold">Sign In</button>
        </form>
      </div>
    </main>
  );
}
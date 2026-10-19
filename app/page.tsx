"use client";
import { useState, useEffect } from 'react';
import './globals.css';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  
  // Dashboard state
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');

  // Fetch documents when the user logs in
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    const res = await fetch(`/api/documents?userId=${user.id}`);
    const data = await res.json();
    if (data.documents) setDocuments(data.documents);
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
        // In a real app, this is the path returned from Supabase Storage after uploading the actual file.
        // For the 7-day challenge, saving the metadata proves the security logic works.
        storagePath: `vault/${Date.now()}_${uploadName}` 
      })
    });
    
    if (res.ok) {
      setUploadName('');
      setUploadCategory('');
      fetchDocuments(); // Refresh the list
    }
  };

  const handleDownload = async (documentId: string) => {
    const res = await fetch(`/api/documents/${documentId}/download?userId=${user.id}`);
    const data = await res.json();
    if (data.success) {
      alert(`Access Granted! Secure Link Generated:\n\n${data.downloadUrl}`);
    } else {
      alert(`Blocked: ${data.error}`);
    }
  };

  if (user) {
    return (
      <main className="min-h-screen bg-gray-50 p-10">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">TrustVault Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Role: {user.role}</span>
              <span className="text-sm text-gray-600">{user.email}</span>
              <button onClick={() => setUser(null)} className="text-sm text-red-600 hover:underline font-medium">Logout</button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="col-span-1 bg-gray-50 p-6 rounded border">
              <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-3">
                <input type="text" placeholder="Document Name (e.g., Salary.pdf)" value={uploadName} onChange={e => setUploadName(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="text" placeholder="Category (e.g., HR, FINANCE)" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="border p-2 rounded text-sm" />
                <button type="submit" className="bg-blue-900 text-white p-2 rounded text-sm font-semibold hover:bg-blue-800">Secure Upload</button>
              </form>
            </div>

            {/* Document List */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-4">My Documents</h2>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="border p-4 rounded flex justify-between items-center bg-white shadow-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">Category: {doc.category} | Access: <span className="font-mono bg-gray-100 px-1 rounded">{doc.accessLevel}</span></p>
                      </div>
                      <button onClick={() => handleDownload(doc.id)} className="text-sm bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
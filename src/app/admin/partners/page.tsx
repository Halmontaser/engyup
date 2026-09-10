"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Shield,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  Users
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface Partner {
  id: string;
  name: string;
  slug: string;
  webhook_url: string | null;
  allowed_origins: string[] | null;
  is_active: boolean;
  rate_limit_per_hour: number;
  created_at: string;
}

interface PartnerCredentials {
  api_key: string;
  api_secret: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    webhook_url: "",
    rate_limit_per_hour: 1000,
    is_active: true
  });
  
  // Credentials state (shown after create/regenerate)
  const [credentials, setCredentials] = useState<PartnerCredentials | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch("/admin/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error("Failed to load partners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPartners = useMemo(() => {
    if (!searchQuery) return partners;
    return partners.filter(
      p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partners, searchQuery]);

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData({
      name: "",
      slug: "",
      webhook_url: "",
      rate_limit_per_hour: 1000,
      is_active: true
    });
    setCredentials(null);
    setIsModalOpen(true);
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      webhook_url: partner.webhook_url || "",
      rate_limit_per_hour: partner.rate_limit_per_hour,
      is_active: partner.is_active
    });
    setCredentials(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Don't clear credentials immediately so they don't flash, wait for animation
    setTimeout(() => {
      setCredentials(null);
    }, 300);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!editingPartner) {
      // Auto-generate slug on create
      const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData({ ...formData, name: newName, slug: autoSlug });
    } else {
      setFormData({ ...formData, name: newName });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingPartner) {
        // Update
        const res = await adminFetch(`/admin/api/partners/${editingPartner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            webhook_url: formData.webhook_url || null,
            rate_limit_per_hour: formData.rate_limit_per_hour,
            is_active: formData.is_active
          })
        });
        
        if (res.ok) {
          const updated = await res.json();
          setPartners(partners.map(p => p.id === editingPartner.id ? updated.partner || updated : p));
          closeModal();
        } else {
          alert("Failed to update partner");
        }
      } else {
        // Create
        const res = await adminFetch("/admin/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            webhook_url: formData.webhook_url || null,
            rate_limit_per_hour: formData.rate_limit_per_hour
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setPartners([...partners, data.partner]);
          setCredentials({
            api_key: data.partner.api_key,
            api_secret: data.partner.api_secret
          });
          // Don't close modal, show credentials
        } else {
          alert("Failed to create partner");
        }
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateKeys = async (partner: Partner) => {
    if (!confirm(`Are you sure you want to regenerate API keys for ${partner.name}? Any existing integrations using the old keys will break immediately.`)) return;
    
    try {
      const res = await adminFetch(`/admin/api/partners/${partner.id}/regenerate-keys`, {
        method: "POST"
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update partner list in case something else changed
        setPartners(partners.map(p => p.id === partner.id ? data.partner : p));
        // Show credentials modal
        setEditingPartner(partner);
        setCredentials({
          api_key: data.partner.api_key,
          api_secret: data.partner.api_secret
        });
        setIsModalOpen(true);
      } else {
        alert("Failed to regenerate keys");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete partner "${name}"? This action cannot be undone and will break all their API access.`)) return;
    
    try {
      const res = await adminFetch(`/admin/api/partners/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPartners(partners.filter(p => p.id !== id));
      } else {
        alert("Failed to delete partner");
      }
    } catch (error) {
      alert("An error occurred while deleting");
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
          <p className="text-slate-600 dark:text-slate-400">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Partners
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage partner applications and API access
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
        >
          <Plus size={18} />
          New Partner
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search partners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Partner List */}
      {filteredPartners.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Users className="mx-auto mb-3 text-slate-400" size={36} />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            No Partners Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
            {searchQuery ? "No partners match your search." : "Create your first partner to grant API access."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 rounded-lg transition-colors font-medium text-sm"
            >
              <Plus size={16} />
              Add Partner
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map(partner => (
            <div key={partner.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{partner.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{partner.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    partner.is_active 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {partner.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <Globe size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="truncate" title={partner.webhook_url || "No webhook URL"}>
                      {partner.webhook_url || <span className="italic text-slate-400">No webhook configured</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="shrink-0 text-slate-400" />
                    <span>{partner.rate_limit_per_hour.toLocaleString()} reqs/hour</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Created {new Date(partner.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRegenerateKeys(partner)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                    title="Regenerate API Keys"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => openEditModal(partner)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                    title="Edit Partner"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id, partner.name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Delete Partner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay & Content */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={credentials ? undefined : closeModal}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {credentials ? 'API Credentials' : editingPartner ? 'Edit Partner' : 'New Partner'}
                </h2>
                {!credentials && (
                  <button
                    onClick={closeModal}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="p-5 overflow-y-auto">
                {credentials ? (
                  <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                      <div className="text-sm">
                        <p className="font-bold mb-1">Important: Save these credentials now!</p>
                        <p>The API Secret will only be shown this one time. If you lose it, you will need to regenerate the keys.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API Key</label>
                        <div className="flex relative">
                          <input
                            type="text"
                            readOnly
                            value={credentials.api_key}
                            className="w-full pl-3 pr-12 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard(credentials.api_key, 'key')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            {copiedKey ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API Secret</label>
                        <div className="flex relative">
                          <input
                            type="text"
                            readOnly
                            value={credentials.api_secret}
                            className="w-full pl-3 pr-12 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard(credentials.api_secret, 'secret')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            {copiedSecret ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition-colors"
                    >
                      I have saved these credentials
                    </button>
                  </div>
                ) : (
                  <form id="partner-form" onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Partner Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleNameChange}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {!editingPartner && (
                      <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Slug * (Auto-generated)
                        </label>
                        <input
                          id="slug"
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          placeholder="acme-corp"
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="webhook_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Webhook URL
                      </label>
                      <input
                        id="webhook_url"
                        type="url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                        placeholder="https://api.acmecorp.com/webhooks/engyup"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="rate_limit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Rate Limit (requests per hour) *
                      </label>
                      <input
                        id="rate_limit"
                        type="number"
                        required
                        min="1"
                        value={formData.rate_limit_per_hour}
                        onChange={(e) => setFormData({...formData, rate_limit_per_hour: parseInt(e.target.value) || 1000})}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {editingPartner && (
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Partner Status
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Inactive partners cannot use the API
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    )}
                  </form>
                )}
              </div>

              {!credentials && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="partner-form"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                    {editingPartner ? 'Save Changes' : 'Create Partner'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

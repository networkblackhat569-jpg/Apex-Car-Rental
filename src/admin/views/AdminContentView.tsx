import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { FAQItem } from '../../types';
import { api } from '../../services/api';

interface AdminContentViewProps {
  onToast: (msg: string) => void;
}

export function AdminContentView({ onToast }: AdminContentViewProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New FAQ form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Verification');

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await api.getFaqs(true);
      setFaqs(data);
    } catch (err) {
      console.error('Failed to load faqs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      if (editingId) {
        const updated = await api.updateFaq(editingId, { question, answer, category });
        setFaqs((prev) => prev.map((f) => (f.id === editingId ? updated : f)));
        onToast('FAQ updated successfully');
      } else {
        const created = await api.createFaq({
          question,
          answer,
          category,
          display_order: faqs.length + 1,
          is_published: 1,
        });
        setFaqs((prev) => [...prev, created]);
        onToast('FAQ created successfully');
      }

      setIsAdding(false);
      setEditingId(null);
      setQuestion('');
      setAnswer('');
    } catch (err: any) {
      onToast(err.message || 'Failed to save FAQ');
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this FAQ entry?')) return;
    try {
      await api.deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      onToast('FAQ deleted');
    } catch (err: any) {
      onToast('Failed to delete FAQ');
    }
  };

  const handleTogglePublished = async (faq: FAQItem) => {
    const nextVal = faq.is_published ? 0 : 1;
    try {
      await api.updateFaq(faq.id, { is_published: nextVal });
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, is_published: nextVal } : f))
      );
      onToast(nextVal ? 'Published to customer site' : 'Unpublished / hidden');
    } catch (err) {
      onToast('Failed to update published status');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">FAQs & Rental Knowledge Base</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage frequently asked questions, customer policies, security deposit terms, and strict matching guides.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setQuestion('');
              setAnswer('');
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New FAQ</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-neutral-900 border border-amber-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white">
              {editingId ? 'Edit FAQ Item' : 'Create New FAQ Item'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Question *</label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Do I receive the exact car model shown in photos?"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Verification">Verification & Authenticity</option>
                <option value="Booking">Booking & Reservation</option>
                <option value="Requirements">Documents & Security</option>
                <option value="Pricing">Rates & Deposits</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Answer *</label>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear, reassuring answer for customers..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{editingId ? 'Save Update' : 'Publish FAQ'}</span>
            </button>
          </div>
        </form>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading FAQ list...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-400">No FAQs created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-amber-400 border border-neutral-700/60">
                    {faq.category}
                  </span>
                  <h4 className="text-xs font-bold text-white">{faq.question}</h4>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2">{faq.answer}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleTogglePublished(faq)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    faq.is_published
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                  }`}
                >
                  {faq.is_published ? 'Published' : 'Draft'}
                </button>

                <button
                  onClick={() => handleEdit(faq)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-700"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

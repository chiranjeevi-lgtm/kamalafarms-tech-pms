import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import ZoneBadge from '../components/ZoneBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import {
  FileText,
  Send,
  Mail,
  Save,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// --------------- Admin/Manager Reviews ---------------

function AdminReviews() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [managerComments, setManagerComments] = useState('');
  const [savingComments, setSavingComments] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [month, year]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews', { params: { month, year } });
      setReviews(res.data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/reviews/generate', { month, year });
      toast.success('Reviews generated successfully');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate reviews');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (reviewId) => {
    setSendingEmail(reviewId);
    try {
      await api.post(`/reviews/${reviewId}/send-email`);
      toast.success('Review email sent');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setManagerComments(review.manager_comments || '');
  };

  const handleSaveComments = async () => {
    if (!selectedReview) return;
    setSavingComments(true);
    try {
      await api.put(`/reviews/${selectedReview.id}`, {
        manager_comments: managerComments,
      });
      toast.success('Comments saved');
      setSelectedReview((prev) => ({ ...prev, manager_comments: managerComments }));
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save comments');
    } finally {
      setSavingComments(false);
    }
  };

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="block w-40 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="block w-28 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Generate Reviews'}
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Reviews - {MONTHS[month - 1]} {year}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incentive</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {review.employee_name || review.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DepartmentBadge department={review.department} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(review.kpi_score).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ZoneBadge zone={review.zone} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {'\u20b9'}{Number(review.incentive_earned || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.email_sent ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <Check className="h-4 w-4" /> Sent
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not sent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReview(review)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleSendEmail(review.id)}
                          disabled={sendingEmail === review.id}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
                        >
                          {sendingEmail === review.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Mail className="h-3 w-3" />
                          )}
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews for this month</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Generate Reviews" to create reviews from KPI data
            </p>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Review Details</h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              {/* Employee Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">
                    {(selectedReview.employee_name || selectedReview.name || '?')[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedReview.employee_name || selectedReview.name}
                  </p>
                  <DepartmentBadge department={selectedReview.department} />
                </div>
              </div>

              {/* Score & Zone */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div
                  className={`rounded-xl p-4 text-center ${
                    selectedReview.zone === 'green'
                      ? 'bg-green-50'
                      : selectedReview.zone === 'yellow'
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                  }`}
                >
                  <p className="text-sm text-gray-500">KPI Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Number(selectedReview.kpi_score).toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Zone</p>
                  <div className="flex justify-center">
                    <ZoneBadge zone={selectedReview.zone} size="lg" />
                  </div>
                </div>
                <div className="rounded-xl p-4 text-center bg-indigo-50">
                  <p className="text-sm text-gray-500">Incentive</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {'\u20b9'}{Number(selectedReview.incentive_earned || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Manager Comments */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manager Comments
                </label>
                <textarea
                  value={managerComments}
                  onChange={(e) => setManagerComments(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                  placeholder="Add your comments..."
                />
                <button
                  onClick={handleSaveComments}
                  disabled={savingComments}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {savingComments ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Comments
                </button>
              </div>

              {/* AI Feedback */}
              {selectedReview.ai_feedback && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    AI Feedback
                  </label>
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap border border-blue-100">
                    {selectedReview.ai_feedback}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSendEmail(selectedReview.id)}
                  disabled={sendingEmail === selectedReview.id}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sendingEmail === selectedReview.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --------------- Employee Reviews ---------------

function EmployeeReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee_id) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get('/reviews', {
          params: { employee_id: user.employee_id },
        });
        setReviews(res.data);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user?.employee_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          My Reviews
        </h3>
        <p className="text-sm text-gray-500">Your monthly performance reviews</p>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                review.zone === 'green'
                  ? 'border-green-500'
                  : review.zone === 'yellow'
                  ? 'border-yellow-500'
                  : 'border-red-500'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {MONTHS[(review.month || 1) - 1]} {review.year}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {Number(review.kpi_score).toFixed(1)}
                    </span>
                    <ZoneBadge zone={review.zone} size="md" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Incentive</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {'\u20b9'}{Number(review.incentive_earned || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {review.manager_comments && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Manager Comments
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {review.manager_comments}
                  </p>
                </div>
              )}

              {review.ai_feedback && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    AI Feedback
                  </p>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">
                    {review.ai_feedback}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No reviews available yet</p>
        </div>
      )}
    </>
  );
}

// --------------- Main Export ---------------

export default function Reviews() {
  const { isAdminOrManager } = useAuth();

  return (
    <Layout>
      {isAdminOrManager ? <AdminReviews /> : <EmployeeReviews />}
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import {
  Settings as SettingsIcon,
  Mail,
  DollarSign,
  AlertCircle,
  Loader2,
  Check,
  Server,
  Users,
  Database,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, systemRes] = await Promise.all([
          api.get('/settings').catch(() => ({ data: null })),
          api.get('/settings/system-info').catch(() => ({ data: null })),
        ]);
        setSettings(settingsRes.data);
        setSystemInfo(systemRes.data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-700">Access Denied</p>
            <p className="text-sm text-gray-500 mt-1">
              Only administrators can access settings
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* SMTP Configuration */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">SMTP Configuration</h3>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                SMTP settings are configured via the <code className="font-mono bg-blue-100 px-1 rounded">.env</code> file on the server. Contact your system administrator to make changes.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="SMTP Host"
                value={settings?.smtp_host || 'Not configured'}
              />
              <InfoField
                label="SMTP Port"
                value={settings?.smtp_port || 'Not configured'}
              />
              <InfoField
                label="SMTP User"
                value={settings?.smtp_user || 'Not configured'}
              />
              <InfoField
                label="SMTP Password"
                value={settings?.smtp_user ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'Not configured'}
              />
              <InfoField
                label="From Email"
                value={settings?.from_email || 'Not configured'}
              />
              <InfoField
                label="Encryption"
                value={settings?.smtp_secure ? 'TLS' : 'None'}
              />
            </div>
          </div>
        </div>

        {/* Company Settings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Company Settings</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Company Name"
                value={settings?.company_name || 'Kamalafarms Tech'}
              />
              <InfoField
                label="Max Increment %"
                value={settings?.max_increment_percentage != null
                  ? `${settings.max_increment_percentage}%`
                  : '15%'}
              />
              <InfoField
                label="Green Zone Incentive"
                value={settings?.green_incentive != null
                  ? `\u20b9${Number(settings.green_incentive).toLocaleString('en-IN')}`
                  : 'Configured per department'}
              />
              <InfoField
                label="Yellow Zone Incentive"
                value={settings?.yellow_incentive != null
                  ? `\u20b9${Number(settings.yellow_incentive).toLocaleString('en-IN')}`
                  : 'Configured per department'}
              />
              <InfoField
                label="Red Zone Incentive"
                value={settings?.red_incentive != null
                  ? `\u20b9${Number(settings.red_incentive).toLocaleString('en-IN')}`
                  : '\u20b90 (No incentive)'}
              />
              <InfoField
                label="Fast Track Threshold"
                value={settings?.fast_track_threshold != null
                  ? `${settings.fast_track_threshold} consecutive green months`
                  : '3 consecutive green months'}
              />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">System Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {systemInfo?.total_users ?? '--'}
                </p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {systemInfo?.total_employees ?? '--'}
                </p>
                <p className="text-sm text-gray-500">Total Employees</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Database className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {systemInfo?.db_status === 'connected' ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <Check className="h-5 w-5" /> Connected
                    </span>
                  ) : (
                    systemInfo?.db_status || '--'
                  )}
                </p>
                <p className="text-sm text-gray-500">Database Status</p>
              </div>
            </div>

            {/* Additional System Details */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Environment"
                value={systemInfo?.environment || 'production'}
              />
              <InfoField
                label="API Version"
                value={systemInfo?.api_version || '1.0.0'}
              />
              <InfoField
                label="Node Version"
                value={systemInfo?.node_version || '--'}
              />
              <InfoField
                label="Uptime"
                value={systemInfo?.uptime || '--'}
              />
            </div>
          </div>
        </div>

        {/* Logged in as */}
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
          Logged in as <span className="font-medium text-gray-700">{user?.name}</span> ({user?.email})
        </div>
      </div>
    </Layout>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

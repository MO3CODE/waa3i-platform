// ============================================================
// src/pages/Admin/tabs/RolesTab.js
// إدارة الأدوار والصلاحيات — للجوكر فقط
// ============================================================
import React, { useState, useEffect } from "react";
import { getUsers, updateUserRole, deleteUser, ROLES, ROLE_LABELS } from "../../../data/db";
import { Btn, Modal } from "../../../components/ui";

const ROLE_COLORS = {
  superadmin:       "#C9A84C",
  content_manager:  "#3A8BC0",
  instructor_admin: "#27AE60",
  student_admin:    "#9B59B6",
  student:          "#8A9BB0",
};

export default function RolesTab({ user: currentUser }) {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");
  const [search,        setSearch]        = useState("");
  const [editModal,     setEditModal]     = useState(null);
  const [selectedRole,  setSelectedRole]  = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  }

  function openEditModal(u) {
    setSelectedRole(u.role);
    setEditModal(u);
  }

  async function handleSaveRole() {
    if (!editModal || selectedRole === editModal.role) { setEditModal(null); return; }
    if (editModal.id === currentUser.id && selectedRole !== ROLES.SUPERADMIN) {
      alert("لا يمكنك تغيير دورك بنفسك إلى غير جوكر");
      return;
    }
    setSaving(true);
    await updateUserRole(editModal.id, selectedRole);
    await load();
    setEditModal(null);
    setSaving(false);
  }

  async function handleDelete(u) {
    if (u.id === currentUser.id) { alert("لا يمكنك حذف حسابك الخاص"); return; }
    await deleteUser(u.id);
    await load();
    setConfirmDelete(null);
  }

  const filtered = users.filter(u => {
    const matchRole   = filter === "all" || u.role === filter;
    const matchSearch = !search || u.name.includes(search) || u.email.includes(search);
    return matchRole && matchSearch;
  });

  const roleCounts = Object.fromEntries(
    Object.keys(ROLES).map(k => [ROLES[k], users.filter(u => u.role === ROLES[k]).length])
  );

  if (loading) return <div className="tab-empty">جاري التحميل...</div>;

  return (
    <div className="roles-tab">

      {/* Stats */}
      <div className="role-stats">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div
            key={role}
            className={`role-stat-card ${filter === role ? "active" : ""}`}
            style={{ borderTop: `3px solid ${ROLE_COLORS[role]}` }}
            onClick={() => setFilter(filter === role ? "all" : role)}
          >
            <div className="stat-count" style={{ color: ROLE_COLORS[role] }}>{roleCounts[role] || 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="roles-toolbar">
        <input
          className="search-input"
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">جميع الأدوار</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Users table */}
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور</th>
              <th>تاريخ التسجيل</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={u.id === currentUser.id ? "current-user-row" : ""}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar" style={{ background: ROLE_COLORS[u.role] }}>
                      {u.avatar || u.name?.[0]}
                    </div>
                    <span className="user-name">{u.name}</span>
                    {u.id === currentUser.id && <span className="you-badge">أنت</span>}
                  </div>
                </td>
                <td><span className="user-email">{u.email}</span></td>
                <td>
                  <span
                    className="role-badge"
                    style={{ background: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44` }}
                  >
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td><span className="date-cell">{u.createdAt}</span></td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="تغيير الدور"
                      onClick={() => openEditModal(u)}
                      disabled={u.role === ROLES.SUPERADMIN && u.id !== currentUser.id}
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn danger"
                      title="حذف"
                      onClick={() => setConfirmDelete(u)}
                      disabled={u.id === currentUser.id}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="tab-empty">لا يوجد مستخدمون مطابقون</div>}
      </div>

      {/* Edit Role Modal */}
      {editModal && (
        <Modal title="تغيير الدور" onClose={() => setEditModal(null)}>
          <div className="edit-role-user">
            <div className="user-avatar lg" style={{ background: ROLE_COLORS[editModal.role] }}>
              {editModal.avatar || editModal.name?.[0]}
            </div>
            <div>
              <div className="edit-role-name">{editModal.name}</div>
              <div className="edit-role-email">{editModal.email}</div>
            </div>
          </div>

          <div className="role-options">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <label
                key={role}
                className={`role-option ${selectedRole === role ? "selected" : ""}`}
                style={selectedRole === role ? { borderColor: ROLE_COLORS[role], background: ROLE_COLORS[role] + "18" } : {}}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                />
                <span className="role-dot" style={{ background: ROLE_COLORS[role] }} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="modal-actions">
            <Btn onClick={handleSaveRole} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغيير"}</Btn>
            <Btn variant="ghost" onClick={() => setEditModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: "var(--text-2)", marginBottom: 20 }}>
            هل أنت متأكد من حذف حساب <strong style={{ color: "var(--gold)" }}>{confirmDelete.name}</strong>؟
            <br />هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="modal-actions">
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete)}>نعم، احذف</Btn>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * Role-based access control middleware factory.
 * Usage: roleCheck('admin', 'manager')
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden. You do not have permission to access this resource.',
      });
    }

    next();
  };
};

module.exports = { roleCheck };

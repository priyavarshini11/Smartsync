import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const BranchSelectionModal = () => {
  const { user, selectedBranch, setSelectedBranch } = useContext(AuthContext);

  // Auto-set branch for all non-student roles so no modal is needed
  useEffect(() => {
    if (!selectedBranch && user) {
      const role = user.role;
      if (role === 'admin' || role === 'admin_faculty' || role === 'faculty') {
        setSelectedBranch('ALL');
      }
    }
  }, [user, selectedBranch, setSelectedBranch]);

  // Never render a modal
  return null;
};

export default BranchSelectionModal;

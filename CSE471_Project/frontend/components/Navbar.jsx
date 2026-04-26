'use client';

import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <h1 style={styles.title}>AshePashe</h1>
        </div>

        <div style={styles.navRight}>
          {isSignedIn && (
            <>
              <span style={styles.userEmail}>
                {user.primaryEmailAddress?.emailAddress}
              </span>
              {/* Clerk UserButton: handles sign-out, profile, and avatar */}
              <UserButton afterSignOutUrl="/login" />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#003366',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1rem'
  },
  logo: {
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userEmail: {
    fontSize: '0.9rem',
    marginRight: '0.5rem'
  },
  logoutBtn: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s'
  }
};
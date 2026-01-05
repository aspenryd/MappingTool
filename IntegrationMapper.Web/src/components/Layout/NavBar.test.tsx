import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './NavBar';
import { describe, it, expect, vi } from 'vitest';

// Mock User
const mockUser = "Test User";

describe('NavBar', () => {
    it('renders correctly with user name', () => {
        render(
            <BrowserRouter>
                <NavBar
                    currentView="systems"
                    onNavigate={() => { }}
                    user={mockUser}
                    onLogout={() => { }}
                />
            </BrowserRouter>
        );

        expect(screen.getByText(/INTEGRATION/i)).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('calls onNavigate when links are clicked', () => {
        const handleNavigate = vi.fn();
        render(
            <BrowserRouter>
                <NavBar
                    currentView="systems"
                    onNavigate={handleNavigate}
                    user={mockUser}
                    onLogout={() => { }}
                />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText('Systems'));
        expect(handleNavigate).toHaveBeenCalledWith('systems');

        fireEvent.click(screen.getByText('Projects'));
        expect(handleNavigate).toHaveBeenCalledWith('projects');
    });

    it('calls onLogout when logout button is clicked', () => {
        const handleLogout = vi.fn();
        render(
            <BrowserRouter>
                <NavBar
                    currentView="systems"
                    onNavigate={() => { }}
                    user={mockUser}
                    onLogout={handleLogout}
                />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText('Logout'));
        expect(handleLogout).toHaveBeenCalled();
    });
});

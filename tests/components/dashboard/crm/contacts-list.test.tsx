/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LeadWithCompany } from "@/hooks/use-crm-leads";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock lead with all required fields
const createMockLead = (overrides: Partial<LeadWithCompany>): LeadWithCompany => ({
  id: "lead-1",
  orgId: "org-123",
  companyId: null,
  employeeId: null,
  searchId: null,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phone: null,
  companyPhone: null,
  jobTitle: "Engineer",
  linkedinUrl: null,
  location: null,
  status: "new",
  notes: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  company: null,
  ...overrides,
});

describe("ContactsList Component", () => {
  const mockLeads: LeadWithCompany[] = [
    createMockLead({
      id: "lead-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      companyPhone: null,
      linkedinUrl: "https://linkedin.com/in/johndoe",
      jobTitle: "Software Engineer",
      status: "new",
      metadata: { apolloId: "apollo-1" },
    }),
    createMockLead({
      id: "lead-2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: null,
      companyPhone: "+9876543210",
      linkedinUrl: "https://linkedin.com/in/janesmith",
      jobTitle: "Product Manager",
      status: "contacted",
      metadata: { apolloId: "apollo-2" },
    }),
    createMockLead({
      id: "lead-3",
      firstName: "Bob",
      lastName: "Wilson",
      email: "bob@example.com",
      phone: null,
      companyPhone: null,
      linkedinUrl: null,
      jobTitle: "Designer",
      status: "qualified",
      metadata: {},
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render empty state when no leads", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={[]} />);

    expect(screen.getByText("No contacts found")).toBeInTheDocument();
  });

  it("should render lead names and titles", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Product Manager")).toBeInTheDocument();
  });

  it("should show personal phone when available", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    expect(screen.getByText("+1234567890")).toBeInTheDocument();
  });

  it("should show company phone when no personal phone", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    expect(screen.getByText("+9876543210")).toBeInTheDocument();
  });

  it("should show Get Phone button when lead has apolloId but no phone", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    const getPhoneButtons = screen.getAllByText("Get Phone");
    expect(getPhoneButtons.length).toBeGreaterThan(0);
  });

  it("should not show Get Phone button when lead has no apolloId", async () => {
    const leadsWithoutApolloId: LeadWithCompany[] = [
      createMockLead({
        ...mockLeads[2],
        companyPhone: null,
        metadata: {}, // No apolloId
      }),
    ];

    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={leadsWithoutApolloId} />);

    expect(screen.queryByText("Get Phone")).not.toBeInTheDocument();
  });

  it("should render status badges", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    expect(screen.getByText("new")).toBeInTheDocument();
    expect(screen.getByText("contacted")).toBeInTheDocument();
    expect(screen.getByText("qualified")).toBeInTheDocument();
  });

  it("should show expand button when more than maxVisible leads", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} maxVisible={2} />);

    expect(screen.getByText(/Show all 3 contacts/)).toBeInTheDocument();
  });

  it("should expand to show all leads when clicking expand button", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const user = userEvent.setup();

    render(<ContactsList leads={mockLeads} maxVisible={2} />);

    // Initially only 2 visible
    expect(screen.queryByText("Bob Wilson")).not.toBeInTheDocument();

    // Click expand
    await user.click(screen.getByText(/Show all 3 contacts/));

    // Now all should be visible
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("should call onStatusChange when status is changed", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    render(<ContactsList leads={mockLeads} onStatusChange={onStatusChange} />);

    // Find the first status dropdown
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "contacted");

    expect(onStatusChange).toHaveBeenCalledWith("lead-1", "contacted");
  });

  it("should fetch phone when Get Phone is clicked", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const { toast } = await import("sonner");
    const onLeadUpdate = vi.fn();
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, phone: "+5551234567" }),
    });

    // Lead without personal phone but with apolloId
    const leadsForTest: LeadWithCompany[] = [mockLeads[1]]; // Jane Smith

    render(<ContactsList leads={leadsForTest} onLeadUpdate={onLeadUpdate} />);

    const getPhoneButton = screen.getByText("Get Phone");
    await user.click(getPhoneButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/leads/lead-2/fetch-phone", {
        method: "POST",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Personal phone number found!");
    });

    expect(onLeadUpdate).toHaveBeenCalledWith("lead-2", { phone: "+5551234567" });
  });

  it("should show error toast when phone fetch fails", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const { toast } = await import("sonner");
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Insufficient credits" }),
    });

    const leadsForTest: LeadWithCompany[] = [mockLeads[1]];

    render(<ContactsList leads={leadsForTest} />);

    const getPhoneButton = screen.getByText("Get Phone");
    await user.click(getPhoneButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Insufficient credits");
    });
  });

  it("should show loading state while fetching phone", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(fetchPromise);

    const leadsForTest: LeadWithCompany[] = [mockLeads[1]];

    render(<ContactsList leads={leadsForTest} />);

    const getPhoneButton = screen.getByText("Get Phone");
    await user.click(getPhoneButton);

    // Should show loading state
    expect(screen.getByText("Fetching phone...")).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true, phone: "+5551234567" }),
    });

    await waitFor(() => {
      expect(screen.queryByText("Fetching phone...")).not.toBeInTheDocument();
    });
  });

  it("should render LinkedIn link when available", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");

    render(<ContactsList leads={mockLeads} />);

    const linkedinLinks = screen.getAllByTitle("View LinkedIn");
    expect(linkedinLinks.length).toBeGreaterThan(0);
    expect(linkedinLinks[0]).toHaveAttribute("href", "https://linkedin.com/in/johndoe");
  });

  it("should copy email when copy button is clicked", async () => {
    const { ContactsList } = await import("@/components/dashboard/crm/contacts-list");
    const user = userEvent.setup();

    // Mock clipboard using Object.defineProperty
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<ContactsList leads={mockLeads} />);

    const copyButtons = screen.getAllByTitle("Copy email");
    await user.click(copyButtons[0]);

    expect(mockWriteText).toHaveBeenCalledWith("john@example.com");
  });
});

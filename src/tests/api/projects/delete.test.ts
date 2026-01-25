import { DELETE } from "@/app/api/projects/[id]/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Mock prisma and auth
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("DELETE /api/projects/[id]", () => {
  const userId = "user_123";
  const projectId = "project_123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/projects/${projectId}`, {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: projectId });

    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if project not found or not owned by user", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: userId } });
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/projects/${projectId}`, {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: projectId });

    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("should delete project and return success if owned by user", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: userId } });
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: projectId, userId });
    (prisma.project.delete as jest.Mock).mockResolvedValue({ id: projectId });

    const req = new Request(`http://localhost/api/projects/${projectId}`, {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: projectId });

    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.project.delete).toHaveBeenCalledWith({
      where: { id: projectId },
    });
  });

  it("should return 500 if database error occurs", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: userId } });
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: projectId, userId });
    (prisma.project.delete as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const req = new Request(`http://localhost/api/projects/${projectId}`, {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: projectId });

    const response = await DELETE(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to delete project");
  });
});

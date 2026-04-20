import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../database/prisma.service";

describe("AuthService", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwt = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  const config = {
    get: jest.fn((key: string) => {
      if (key === "auth.jwtExpirySeconds") return 86400;
      return undefined;
    }),
  } as unknown as ConfigService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwt, config);
  });

  it("register should create user when email is free", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      displayName: "User",
      role: Role.TRAVELLER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.register({
      email: "user@example.com",
      password: "password123",
      displayName: "User",
    });

    expect(result.email).toBe("user@example.com");
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("register should reject duplicate email", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

    await expect(
      service.register({
        email: "user@example.com",
        password: "password123",
        displayName: "User",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("login should return jwt token when credentials are valid", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      role: Role.TRAVELLER,
      passwordHash,
    });
    (jwt.signAsync as jest.Mock).mockResolvedValue("jwt-token");

    const result = await service.login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({ accessToken: "jwt-token", expiresIn: 86400 });
  });

  it("login should reject invalid credentials", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({
        email: "user@example.com",
        password: "wrong-pass",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

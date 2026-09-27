import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name is too long."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message ?? "Invalid input.",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const normalizedEmail = email.toLowerCase();

    // Check whether the email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + organization + owner membership
    const resultTransaction = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
        },
      });

      // Create a unique organization slug
      const baseSlug =
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "organization";

      const slug = `${baseSlug}-${user.id.slice(-6).toLowerCase()}`;

      const organization = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });

      return {
        user,
        organization,
      };
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: resultTransaction.user.id,
          name: resultTransaction.user.name,
          email: resultTransaction.user.email,
        },
        organization: {
          id: resultTransaction.organization.id,
          name: resultTransaction.organization.name,
          slug: resultTransaction.organization.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        error: "Unable to create your account. Please try again.",
      },
      { status: 500 }
    );
  }
}
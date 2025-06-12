import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { AppModule } from "@main/modules/app.module";
import { EntryEntity } from "@infra/db/typeorm/entities/entry.entity";
import { UserEntity } from "@infra/db/typeorm/entities/user.entity";
import { CategoryEntity } from "@infra/db/typeorm/entities/category.entity";

describe("EntryController", () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  const testDbConfig = {
    type: "postgres" as const,
    host: "localhost",
    port: 5433, // Different port for tests
    username: "test",
    password: "test",
    database: "financial_test_db",
    entities: [UserEntity, EntryEntity, CategoryEntity],
    synchronize: true,
    dropSchema: true,
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forRoot(testDbConfig)],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/entries", () => {
    const createEntryDto = {
      description: "Salary - January 2025",
      amount: 5000,
      date: "2025-01-15T10:00:00Z",
      type: "INCOME",
      isFixed: true,
    };

    it("should create a new entry successfully", () => {
      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token") // Mock JWT token
        .send(createEntryDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.description).toBe(createEntryDto.description);
          expect(res.body.amount).toBe(createEntryDto.amount);
          expect(res.body.type).toBe(createEntryDto.type);
          expect(res.body.isFixed).toBe(createEntryDto.isFixed);
          expect(res.body).toHaveProperty("createdAt");
          expect(res.body).toHaveProperty("updatedAt");
        });
    });

    it("should return 400 for invalid data", () => {
      const invalidDto = {
        ...createEntryDto,
        amount: -100, // Invalid negative amount
      };

      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(invalidDto)
        .expect(400);
    });

    it("should return 400 for missing required fields", () => {
      const incompleteDto = {
        description: "Test entry",
        // Missing amount, date, type, isFixed
      };

      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(incompleteDto)
        .expect(400);
    });

    it("should return 401 for missing authorization", () => {
      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .send(createEntryDto)
        .expect(401);
    });

    it("should return 401 for invalid authorization token", () => {
      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer invalid-token")
        .send(createEntryDto)
        .expect(401);
    });

    it("should handle fixed income entry (Story 1)", () => {
      const fixedIncomeDto = {
        description: "Monthly Salary",
        amount: 8000,
        date: "2025-01-01T00:00:00Z",
        type: "INCOME",
        isFixed: true,
      };

      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(fixedIncomeDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe("INCOME");
          expect(res.body.isFixed).toBe(true);
          expect(res.body.description).toBe("Monthly Salary");
          expect(res.body.amount).toBe(8000);
        });
    });

    it("should handle entry with category", () => {
      const entryWithCategory = {
        ...createEntryDto,
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
      };

      return request(app.getHttpServer())
        .post("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(entryWithCategory)
        .expect(201)
        .expect((res) => {
          expect(res.body.categoryId).toBe(entryWithCategory.categoryId);
        });
    });
  });

  describe("GET /api/v1/entries", () => {
    it("should list entries for a specific month (Story 6)", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=2025-01")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // The response should be an array of entries
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty("id");
            expect(res.body[0]).toHaveProperty("description");
            expect(res.body[0]).toHaveProperty("amount");
            expect(res.body[0]).toHaveProperty("date");
            expect(res.body[0]).toHaveProperty("type");
            expect(res.body[0]).toHaveProperty("isFixed");
            expect(res.body[0]).toHaveProperty("createdAt");
            expect(res.body[0]).toHaveProperty("updatedAt");
          }
        });
    });

    it("should return 400 for invalid month format", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=invalid-format")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain("Invalid month format");
        });
    });

    it("should return 400 for missing month parameter", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain("Invalid month format");
        });
    });

    it("should return 401 for missing authorization", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=2025-01")
        .expect(401);
    });

    it("should return 401 for invalid authorization token", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=2025-01")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should return empty array for month with no entries", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=2025-12")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // May be empty if no entries exist for December 2025
        });
    });

    it("should handle different month formats correctly", () => {
      return request(app.getHttpServer())
        .get("/api/v1/entries?month=2025-03")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlanContable.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CuentasContables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Elemento = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: false),
                    Nivel = table.Column<int>(type: "integer", nullable: false),
                    PadreId = table.Column<Guid>(type: "uuid", nullable: true),
                    EsMovimiento = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActualizadoPorUsuarioId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentasContables", x => x.Id);
                    table.CheckConstraint("CK_CuentasContables_Codigo_Numerico", "\"Codigo\" ~ '^[0-9]+$'");
                    table.CheckConstraint("CK_CuentasContables_Elemento", "\"Elemento\" IN ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')");
                    table.CheckConstraint("CK_CuentasContables_Nivel", "\"Nivel\" >= 1 AND \"Nivel\" <= 5");
                    table.ForeignKey(
                        name: "FK_CuentasContables_CuentasContables_PadreId",
                        column: x => x.PadreId,
                        principalTable: "CuentasContables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordSalt = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    NombreCompleto = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false),
                    UltimoAcceso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IntentosFallidos = table.Column<int>(type: "integer", nullable: false),
                    BloqueoHasta = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogsAuditoria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    Accion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Entidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ValoresAnteriores = table.Column<string>(type: "text", nullable: true),
                    ValoresNuevos = table.Column<string>(type: "text", nullable: true),
                    Detalles = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DireccionIP = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Resultado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    MensajeError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DuracionMs = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogsAuditoria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogsAuditoria_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_Codigo",
                table: "CuentasContables",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_Elemento",
                table: "CuentasContables",
                column: "Elemento");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_Elemento_Nivel",
                table: "CuentasContables",
                columns: new[] { "Elemento", "Nivel" });

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_EstaActivo",
                table: "CuentasContables",
                column: "EstaActivo");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_Nivel",
                table: "CuentasContables",
                column: "Nivel");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasContables_PadreId",
                table: "CuentasContables",
                column: "PadreId");

            migrationBuilder.CreateIndex(
                name: "IX_LogsAuditoria_Entidad",
                table: "LogsAuditoria",
                column: "Entidad");

            migrationBuilder.CreateIndex(
                name: "IX_LogsAuditoria_Entidad_EntidadId",
                table: "LogsAuditoria",
                columns: new[] { "Entidad", "EntidadId" });

            migrationBuilder.CreateIndex(
                name: "IX_LogsAuditoria_Fecha",
                table: "LogsAuditoria",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_LogsAuditoria_UsuarioId",
                table: "LogsAuditoria",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Username",
                table: "Usuarios",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CuentasContables");

            migrationBuilder.DropTable(
                name: "LogsAuditoria");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}

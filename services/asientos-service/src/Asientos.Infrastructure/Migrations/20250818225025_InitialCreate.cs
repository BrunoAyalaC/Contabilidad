using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Asientos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Asientos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Glosa = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UsuarioId = table.Column<string>(type: "text", nullable: false),
                    Estado = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Asientos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DetallesAsiento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CuentaCodigo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Debe = table.Column<decimal>(type: "numeric", nullable: false),
                    Haber = table.Column<decimal>(type: "numeric", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    AsientoContableId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetallesAsiento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetallesAsiento_Asientos_AsientoContableId",
                        column: x => x.AsientoContableId,
                        principalTable: "Asientos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetallesAsiento_AsientoContableId",
                table: "DetallesAsiento",
                column: "AsientoContableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetallesAsiento");

            migrationBuilder.DropTable(
                name: "Asientos");
        }
    }
}

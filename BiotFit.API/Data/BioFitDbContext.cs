using BiotFit.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BiotFit.API.Data
{
    public class BioFitDbContext : DbContext
    {
        public DbSet<Usuario> Usuarios { get; set; }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("DataSource=petCafe.db;Cache=Shared");
        }
    }
}

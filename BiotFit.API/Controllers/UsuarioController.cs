using BiotFit.API.Data;
using BiotFit.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;

namespace BiotFit.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsuarioController : ControllerBase
    {
        private BioFitDbContext db;

        public UsuarioController(BioFitDbContext context) {
            db = context;
        }

        [HttpGet]
        [Route("listar")]
        public async Task<ActionResult<IEnumerable<Usuario>>> Listar()
        {
            if (db is null) return NotFound();
            if (db.Usuarios is null) return NotFound();
            return await db.Usuarios.ToListAsync();
        }


        [HttpPost]
        [Route("cadastrar")]
        public async Task<ActionResult> Cadastrar(Usuario usuario)
        {
            if (db is null) return NotFound();
            if (db.Usuarios is null) return NotFound();
            await db.AddAsync(usuario);
            await db.SaveChangesAsync();
            return Created("", usuario);
            }
    } 
}

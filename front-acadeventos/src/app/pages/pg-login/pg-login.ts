import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-pg-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pg-login.html'
})
export class PgLogin {
  nome = '';

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  entrar() {
    this.usuarioService.logarUsuario(this.nome).subscribe({
      next: (resposta) => {
        const username = this.nome.trim() || 'Victor';
        localStorage.setItem('usuarioNome', username);

        if (resposta.usuario.isOrganizer) {
          localStorage.setItem('usuarioPerfil', 'organizador');
          this.router.navigate(['/homepage']);
        } else {
          localStorage.setItem('usuarioPerfil', 'participante');
          this.router.navigate(['/homepage']);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          alert('Usuário não encontrado.');
        } else {
          alert('Erro ao fazer login: ' + err.message);
        }
      }
    });
  }

  irParaCadastro() {
    this.router.navigate(['/register'])
  }
}
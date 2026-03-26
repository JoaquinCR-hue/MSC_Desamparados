import { useEffect, useState } from "react";
import ServiceUsuarios from "../services/ServiceUsuarios";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import AuthLayout from "./shared/AuthLayout";
import AuthHeader from "./shared/AuthHeader";
import InputGroup from "./shared/InputGroup";
import PasswordInput from "./shared/PasswordInput";
import AuthButton from "./shared/AuthButton";
import AuthFooter from "./shared/AuthFooter";
import { useNavigate } from "react-router-dom";

function FormLogin() {
  const [contra, setContra] = useState("");
  const [cedula, setCedula] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function traerUsuarios() {
      try {
        const peticion = await ServiceUsuarios.getUsuarios();
        setUsuarios(peticion || []);
      } catch (error) {
        console.error("Error al cargar usuarios", error);
      }
    }
    traerUsuarios();
  }, []);

  const validarInicio = (e) => {
    e.preventDefault();

    const cedulaRegex = /^[1-9]\d{8}$/;

    if (!cedula || !contra) {
      Swal.fire({
        title: "Error",
        text: "Todos los campos son obligatorios y no pueden estar vacíos 💜",
        icon: "warning",
      });
      return;
    }

    // Verificar formato de cédula
    if (!cedulaRegex.test(cedula)) {
      Swal.fire({
        title: "Seguridad",
        text: "Por su seguridad y la de nuestros habitantes, el formato de la cédula no es válido (deben ser 9 dígitos).",
        icon: "warning",
      });
      return;
    }

    // Asegurarse de que usuarios sea un arreglo
    const listaUsuarios = Array.isArray(usuarios)
      ? usuarios
      : usuarios.usuarios || [];

    if (listaUsuarios.length === 0) {
      Swal.fire({
        title: "Error de Servidor",
        text: "La base de datos de usuarios está vacía o no se pudo cargar correctamente.",
        icon: "error",
      });
      return;
    }

    const usuarioExistente = listaUsuarios.find(
      (u) => String(u.cedula || "").trim() === String(cedula).trim(),
    );

    if (!usuarioExistente) {
      Swal.fire({
        title: "Error de Acceso",
        text: `La cédula ${cedula} no se encuentra registrada en el sistema (Total usuarios: ${listaUsuarios.length}).`,
        icon: "error",
      });
      return;
    }

    if (usuarioExistente.pass !== contra) {
      Swal.fire({
        title: "Error",
        text: "Credenciales incorrectas. Por favor, intente de nuevo.",
        icon: "error",
      });
      return;
    }

    // Si todo es correcto
    sessionStorage.setItem("user", JSON.stringify(usuarioExistente));

    let mensajeBienvenida = '';
    if (usuarioExistente.role === "admin") {
      mensajeBienvenida = `Bienvenido Administrador(a) ${usuarioExistente.nombre || ''} al sistema MSC.`;
    } else if (usuarioExistente.role === "funcionario") {
      mensajeBienvenida = `Bienvenido Oficial ${usuarioExistente.nombre || ''}, listo para patrullar.`;
    } else {
      mensajeBienvenida = `¡Hola ${usuarioExistente.nombre || 'Ciudadano'}! Gracias por ayudar a la comunidad.`;
    }

    Swal.fire({
      title: "¡Acceso Autorizado!",
      text: mensajeBienvenida,
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      background: "#1f2937",
      color: "#fff"
    }).then(() => {
      if (usuarioExistente.role === "admin") {
        navigate("/gestion-usuarios");
      } else if (usuarioExistente.role === "ciudadano") {
        navigate("/VistaCiudadano");
      } else {
        navigate("/VistaFuncionario");
      }
    });
  };

  const recuperarContrasena = async () => {
    const { value: emailIngresado } = await Swal.fire({
      title: "Recuperar Contraseña",
      input: "email",
      inputLabel: "Ingresa el correo asociado a tu cuenta",
      showCancelButton: true,
      confirmButtonText: "Enviar nueva clave",
      cancelButtonText: "Cancelar",
    });

    if (emailIngresado) {
      const usuarioEncontrado = usuarios.find(
        (u) => u.email === emailIngresado,
      );

      if (usuarioEncontrado) {
        const nuevaClave = Math.random().toString(36).slice(-8); // más segura

        try {
          // 🔐 Actualizar contraseña en backend
          await ServiceUsuarios.recuperarContra(usuarioEncontrado.id, {
            pass: nuevaClave,
          });

          // 📧 Parámetros EXACTOS según tu template
          const templateParams = {
            email: emailIngresado,
            password: nuevaClave,
          };

          // 🚀 Envío con EmailJS
          await emailjs.send(
            "service_rn1linm",
            "template_hn9zqj4",
            templateParams,
            "gYn0FdHihGBZzj5vp",
          );

          Swal.fire(
            "¡Éxito!",
            "Revisa tu correo con tu nueva contraseña temporal.",
            "success",
          );
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "No se pudo procesar la solicitud", "error");
        }
      } else {
        Swal.fire("Error", "Ese correo no está registrado", "error");
      }
    }
  };
  return (
    <AuthLayout>
      <AuthHeader subtitle="Inicia sesión con tu cuenta oficial" />

      <form onSubmit={validarInicio}>
        <InputGroup
          label="Cédula"
          value={cedula}
          placeholder="Ingrese su cédula"
          onChange={(evento) =>
            setCedula(evento.target.value.replace(/\D/g, ""))
          }
        />

        <PasswordInput
          label="Contraseña"
          value={contra}
          onChange={(evento) => setContra(evento.target.value)}
        />

        <AuthButton text="INICIAR SESIÓN" />
      </form>

      <AuthFooter
        text="¿No eres miembro?"
        linkText="Registrate"
        linkTo="/registrarse"
        onClickExtra={recuperarContrasena}
        extraLinkText="¿Olvidaste tu contraseña?"
      />
    </AuthLayout>
  );
}

export default FormLogin;

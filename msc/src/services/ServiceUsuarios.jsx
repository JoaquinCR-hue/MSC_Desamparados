async function getUsuarios() {

    try {

        const respuestaServidor = await fetch("http://localhost:3001/usuarios")
      
        
        const datosUsuarios= await respuestaServidor.json();
   
        
        return datosUsuarios;
        
    } catch (error) {
        
        console.error("Error al obtener los usuarios", error);
    }


}



//POST USUARIOS AQUI S EVA A CREAR LA FUNCION PARA GUARDAR UN NUEVO USUARIO


async function postUsuarios(usuario){

       try {

        const respuesta = await fetch("http://localhost:3001/usuarios",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(usuario)

        })

        const datosUsuarios= await respuesta.json();

        return datosUsuarios;
        
    } catch (error) {
        
        console.error("Error al obtener los usuarios", error);
    }



}


//PUT


async function putUsuarios(usuario,id){

       try {

        const respuesta = await fetch("http://localhost:3001/usuarios/"+id,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(usuario)

        })

        const datosUsuarios= await respuesta.json();

        return datosUsuarios;
        
    } catch (error) {
        
        console.error("Error al actualizar los cambios", error);
    }
}


//DELETE



async function deleteUsuarios(id){

       try {

        const respuesta = await fetch("http://localhost:3001/usuarios/"+id,{
            method:"DELETE",
        })

        const datosUsuarios= await respuesta.json();

        return datosUsuarios;
        
    } catch (error) {
        
        console.error("Error al Eliminar el registro", error);
    }
}
export default{getUsuarios,postUsuarios,putUsuarios,deleteUsuarios}
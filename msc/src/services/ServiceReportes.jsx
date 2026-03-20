async function getReportes() {

    try {

        const respuestaServidor = await fetch("http://127.0.0.1:3001/reportes")
      
        
        const datosReportes= await respuestaServidor.json();
   
        
        return datosReportes;
        
    } catch (error) {
        
        console.error("Error al obtener los reportes", error);
    }


}



//POST USUARIOS AQUI S EVA A CREAR LA FUNCION PARA GUARDAR UN NUEVO USUARIO


async function postReportes(reporte){

       try {

        const respuesta = await fetch("http://127.0.0.1:3001/reportes",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(reporte)

        })

        const datosReportes= await respuesta.json();

        return datosReportes;
        
    } catch (error) {
        
        console.error("Error al obtener los reportes", error);
    }



}


//PUT


async function putReportes(reporte,id){

       try {

        const respuesta = await fetch("http://127.0.0.1:3001/reportes/"+id,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(reporte)

        })

        const datosReportes= await respuesta.json();

        return datosReportes;
        
    } catch (error) {
        
        console.error("Error al actualizar los cambios", error);
    }
}


//DELETE



async function deleteReportes(id){

       try {

        const respuesta = await fetch("http://localhost:3001/reportes/"+id,{
            method:"DELETE",
        })

        const datosReportes= await respuesta.json();

        return datosReportes;
        
    } catch (error) {
        
        console.error("Error al Eliminar el registro", error);
    }
}
export default{getReportes,postReportes,putReportes,deleteReportes}
async function getPolicias() {

    try {

        const respuestaServidor = await fetch("http://127.0.0.1:3001/policias")
      
        
        const datosPolicias= await respuestaServidor.json();
   
        
        return datosPolicias;
        
    } catch (error) {
        
        console.error("Error al obtener los policias", error);
    }


}



//POST USUARIOS AQUI S EVA A CREAR LA FUNCION PARA GUARDAR UN NUEVO USUARIO


async function postPolicias(policia){

       try {

        const respuesta = await fetch("http://127.0.0.1:3001/policias",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(policia)

        })

        const datosPolicias= await respuesta.json();

        return datosPolicias;
        
    } catch (error) {
        
        console.error("Error al obtener los policias", error);
    }



}


//PUT


async function putPolicias(policia,id){

       try {

        const respuesta = await fetch("http://127.0.0.1:3001/policias/"+id,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(policia)

        })

        const datosPolicias= await respuesta.json();

        return datosPolicias;
        
    } catch (error) {
        
        console.error("Error al actualizar los cambios", error);
    }
}


//DELETE



async function deletePolicias(id){

       try {

        const respuesta = await fetch("http://127.0.0.1:3001/policias/"+id,{
            method:"DELETE",
        })

        const datosPolicias= await respuesta.json();

        return datosPolicias;
        
    } catch (error) {
        
        console.error("Error al Eliminar el registro", error);
    }
}



export default {getPolicias, postPolicias, putPolicias, deletePolicias};

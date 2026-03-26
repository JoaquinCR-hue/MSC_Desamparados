async function getReportes() {

    try {

        const respuestaServidor = await fetch("http://127.0.0.1:3001/reportes")
      
        
        const datosReportes= await respuestaServidor.json();
        
        // Add a small pseudo-random offset based on ID to prevent markers from perfectly stacking
        const reportesConOffset = datosReportes.map(reporte => {
            if (reporte.lat && reporte.lng) {
                // Use a simple hash of the ID or string to get a consistent pseudo-random number
                const idStr = String(reporte.id || Math.random());
                let hash = 0;
                for (let i = 0; i < idStr.length; i++) {
                    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
                    hash |= 0; 
                }
                const random1 = Math.abs(Math.sin(hash)) * 0.0004 - 0.0002;
                const random2 = Math.abs(Math.cos(hash)) * 0.0004 - 0.0002;
                
                return {
                    ...reporte,
                    lat: parseFloat(reporte.lat) + random1,
                    lng: parseFloat(reporte.lng) + random2
                };
            }
            return reporte;
        });
        
        return reportesConOffset;
        
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
const PartnerSettlement = require("../models/PartnerSettlement");
const DeliveryPartner = require("../models/DeliveryPartner");
const DeliveryPartnerPayment = require("../models/DeliveryPartnerPayment");


// =====================================
// ADMIN SETTLE PARTNER PAYMENT
// =====================================

exports.settlePartnerPayment = async (req, res) => {

  try {

    const {
      deliveryPartnerId,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;



    // Find Pending COD Submission
    const payments =
      await DeliveryPartnerPayment.find({
        partner: deliveryPartnerId,
        status: "Pending",
      });



    if (!payments.length) {

      return res.status(400).json({

        success:false,

        message:
        "No pending settlement found."

      });

    }



    // Find Partner

    const partner =
      await DeliveryPartner.findById(
        deliveryPartnerId
      );



    if(!partner){

      return res.status(404).json({

        success:false,

        message:
        "Delivery Partner not found."

      });

    }



    // Total Amount

    const totalAmount =
      payments.reduce(
        (sum,payment)=>

          sum +
          Number(payment.amount || 0)

        ,
        0
      );




    // Create Settlement

    const settlement =
      await PartnerSettlement.create({

        deliveryPartner:
        partner._id,


        deliveryPartnerName:
        partner.name,


        paymentIds:
        payments.map(
          p=>p._id
        ),


        orderIds:
        payments.flatMap(
          p=>p.orders
        ),


        totalOrders:
        payments.reduce(
          (sum,p)=>
          sum + p.orders.length,
          0
        ),


        totalAmount,


        paymentMode,


        transactionId,


        remarks,


        settledBy:
        "Admin",


      });





    // Update Delivery Payment

    await DeliveryPartnerPayment.updateMany(

      {
        _id:{
          $in:
          payments.map(
            p=>p._id
          )
        }
      },


      {

        $set:{

          status:"Approved",

          approvedAt:
          new Date(),


          settlementId:
          settlement._id

        }

      }

    );





    res.json({

      success:true,

      message:
      "Partner payment settled successfully.",

      settlement

    });



  }

  catch(err){

    console.log(
      "SETTLEMENT ERROR 👉",
      err
    );


    res.status(500).json({

      success:false,

      message:
      err.message

    });

  }

};





// =====================================
// PARTNER SUMMARY
// =====================================

exports.getPartnerSummary = async(req,res)=>{


try{


const partners =
await DeliveryPartner.find();



const summary=[];



for(const partner of partners){



// Approved / Paid

const paid =
await DeliveryPartnerPayment.aggregate([

{

$match:{

partner:
partner._id,

status:
"Approved"

}

},


{

$group:{

_id:null,


amount:{

$sum:"$amount"

},


count:{

$sum:1

}

}

}

]);





// Pending

const pending =
await DeliveryPartnerPayment.aggregate([

{

$match:{

partner:
partner._id,

status:
"Pending"

}

},


{

$group:{

_id:null,


amount:{

$sum:"$amount"

},


count:{

$sum:1

}

}

}

]);





summary.push({

partnerId:
partner._id,


partnerName:
partner.name,


paid:
paid[0]?.amount || 0,


pending:
pending[0]?.amount || 0,


totalOrders:
(paid[0]?.count || 0)
+
(pending[0]?.count || 0),



totalCollected:
(paid[0]?.amount || 0)
+
(pending[0]?.amount || 0)



});



}



res.json({

success:true,

summary

});



}

catch(err){


console.log(err);


res.status(500).json({

success:false,

message:
err.message

});


}


};





// =====================================
// SETTLEMENT HISTORY
// =====================================

exports.getPartnerSettlementHistory =
async(req,res)=>{


try{


const history =

await PartnerSettlement.find()

.sort({

settledDate:-1

});



res.json({

success:true,

history

});


}

catch(err){


res.status(500).json({

success:false,

message:
err.message

});


}


};
import requests
from flask import request, abort
from flask_restplus import Namespace, Resource, reqparse
from .core.database import Database
from .core.swagger_models import water_body, node, string_array
from dateutil import parser as date_parser
from functools import reduce
from datetime import datetime

api = Namespace('water-bodies', description='Water bodies related operations')

# API schemas
water_body = api.schema_model('WaterBody', water_body)
node = api.schema_model('Node', node)
string_array = api.schema_model('StringArray', string_array)

@api.route('/')
class WaterBody(Resource):
    @api.doc(summary='Get all the water bodies',
             description='Returns a collection of water bodies',
             responses={200: ('Water body collection', [water_body])})
    def get(self):
        """
        The water bodies are in a format that LeafletJS can
        interpret.
        """
        return [{**water_body, '_id': str(water_body['_id'])} for water_body in Database().get_water_bodies()]

@api.route('/<string:water_body_id>/nodes')
@api.param('water_body_id',
           description='Id of the water body to return',
           _in='path',
           required=True,
           type='string')
class WaterBodyNodes(Resource):
    @api.doc(summary='Get all nodes that analyze a given water body',
             description='Returns a collection of nodes',
             responses={200: ('Node collection', [node]),
                        404: 'Node type not found'})
    def get(self, water_body_id):
        return [{**wb, '_id': str(wb['_id'])}
                for wb in Database().get_water_body_nodes(water_body_id)]


@api.route('/<string:water_body_id>/icampff')
@api.param('water_body_id',
           description='Id of the water body',
           _in='path',
           required=True,
           type='string')
class WaterBodyICAMpff(Resource):
    @api.doc(summary='Get the ICAMpff value of a given water body',
             responses={200: 'Icampff value as an integer',
                        404: 'Node type not found'})
    def get(self, water_body_id):
        def icampff(node_id):
            d = [
                Database().get_sensor_data(node_id, "Dissolved Oxygen (DO)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Nitrate (NO3)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Total Suspended Solids (TSS)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Thermotolerant Coliforms", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "pH", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Phosphates (PO4)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Biochemical Oxygen Demand (BOD)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1,
                Database().get_sensor_data(node_id, "Chrolophyll A (CLA)", start_date="2016-1-1", end_date=str(datetime.utcnow()))["data"][-1] or -1
            ]
            return requests.get("http://buritaca.invemar.org.co/ICAMWebService/calculate-icam-ae/od/{}/no3/{}/sst/{}/ctt/{}/ph/{}/po4/{}/dbo/{}/cla/{}".format(*[v['value'] for v in d])).json()['value']
        ics = [icampff(nid) for nid in Database().get_water_body_nodes(water_body_id)]
        if not ics:
            return 0
        return round(sum(ics) / len(ics))


@api.route('/<string:water_body_id>/add-node')
@api.param('node_id', description='Node id of the node to add', _in='query', required=True, type='string')
@api.param('water_body_id', description='Id of the water body', _in='path', required=True, type='string')
class AddNodeToWaterBody(Resource):
    @api.doc(summary='Update the node list of a water body', responses={200: ('Water body updated successfully')})
    def post(self, water_body_id):
        parser = reqparse.RequestParser()
        parser.add_argument('node_id', type=str, required=True, location='args')
        args = parser.parse_args()
        if Database().add_node_to_water_body(args['node_id'], water_body_id):
            return {'message': 'water body updated successfully'}, 200
        else:
            return {'message': 'Error, maybe the node or the water body doesn\'t exist, the node is already associated to the water body or the node is not of type Water Quality'}, 400


@api.route('/<string:water_body_id>/remove_nodes')
@api.param('water_body_id', description='Id of the water body', _in='path', required=True, type='string')
class RemoveNodesFromWaterBody(Resource):
    @api.doc(summary='Update the node list of a water body', responses={200: ('Water body updated successfully')})
    @api.expect(string_array)
    def put(self, water_body_id):
        args = request.get_json()
        if type(args) != list:
            return {'message': 'Wrong data format'}, 400
        elif len(args) == 1 and type(args[0]) != str:
            return {'message': 'Wrong data format'}, 400
        elif len(args) > 1 and reduce(lambda x, y: str if type(x) == type(y) == str else False,args) != str:
            return {'message': 'Wrong data format'}, 400
        if Database().remove_nodes_from_water_body(water_body_id, args):
            return {'message': 'Water body updated successfully'}, 200
        return {'message': 'Wrong data format'}, 400
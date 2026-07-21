<?php
namespace app\api\controller;

use think\Controller;
use app\api\model\Category as CategoryModel;
use app\api\model\Food as FoodModel;

class PublicFood extends Controller
{
    public function list()
    {
        $url = $this->request->domain() . '/static/uploads/';
        $category = CategoryModel::field('id,name')->order('sort', 'asc')->select()->toArray();
        $food = FoodModel::field('id,category_id,name,price,image_url')->where('status', '1')->order('id', 'asc')->select()->toArray();
        foreach ($food as $k => $v) {
            $food[$k]['image_url'] = $url . $v['image_url'];
        }
        $data = [];
        foreach ($category as $v) {
            $data[$v['id']] = array_merge($v, ['food' => []]);
            foreach ($food as $vv) {
                if ($v['id'] === $vv['category_id']) {
                    $data[$v['id']]['food'][$vv['id']] = $vv;
                }
            }
        }
        return json([
            'list' => $data,
            'promotion' => []
        ]);
    }
}
